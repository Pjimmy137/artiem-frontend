import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { HotelService } from '../../services/hotel';

@Component({
  selector: 'app-booking-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './booking-checkout.html',
  styleUrl: './booking-checkout.css',
})
export class BookingCheckoutComponent implements OnInit {
  private bookingService = inject(BookingService);
  private hotelService = inject(HotelService);
  private router = inject(Router);
  serviciosWellness = signal<any[]>([]);

  // Recuperamos la información del paso anterior
  datosReserva = this.bookingService.reservaActual;

  // 🌟 NUEVO: Exponemos los extras seleccionados directamente para el HTML de resumen
  extrasSeleccionados = computed(() => this.datosReserva()?.extras || []);

  // Modelo del Formulario
  nombre = signal<string>('');
  apellidos = signal<string>('');
  email = signal<string>('');
  telefono = signal<string>('');
  prefijo = signal<string>('+34');
  aceptaTerminos = signal<boolean>(false);

  // Estados de carga de la pasarela simulada
  total = computed(() => this.datosReserva()?.precio_total || 0);
  pagoAhora = computed(() => Number((this.total() * 0.3).toFixed(2)));
  pagoEnHotel = computed(() => Number((this.total() * 0.7).toFixed(2)));
  procesandoPago = signal<boolean>(false);

  ngOnInit() {
    if (!this.datosReserva()) {
      this.router.navigate(['/']);
    }

    this.hotelService.obtenerServiciosWellness().subscribe({
      next: (servicios) => {
        this.serviciosWellness.set(servicios);
      },
      error: (err) => {
        console.error('Error al cargar los servicios wellness', err);
      }
    });
  }

  formularioValido = computed(() => {
    return (
      this.nombre().trim() !== '' &&
      this.apellidos().trim() !== '' &&
      this.email().includes('@') &&
      this.telefono().trim() !== '' &&
      this.aceptaTerminos()
    );
  });

  ejecutarPago() {
    if (!this.formularioValido()) return;

    this.procesandoPago.set(true);

    // Formateador de fechas seguro
    const formatear = (d: Date) => {
      if (!d) return '';
      const fecha = new Date(d);
      return fecha.toISOString().split('T')[0];
    };

    // Preparación definitiva del Payload para Laravel
    const payload = {
      hotel_id: this.datosReserva().hotel_id,
      tipo_habitacion: this.datosReserva().tipo_habitacion,
      fecha_entrada: formatear(this.datosReserva().fecha_entrada),
      fecha_salida: formatear(this.datosReserva().fecha_salida),
      cliente: {
        nombre: this.nombre(),
        apellidos: this.apellidos(),
        email: this.email(),
        telefono: `${this.prefijo()}${this.telefono()}`,
      },
      // 🌟 CORREGIDO: Mapeamos el objeto completo asegurando 'id_servicio' y 'precio_extra' de tu DB
      extras: this.extrasSeleccionados().map((e: any) => ({
        id_servicio: e.id_servicio,
        nombre: e.nombre,
        precio_extra: e.precio_extra
      })),
      monto_total: this.total(),
      monto_pagado_online: this.pagoAhora(),
      estado: 'confirmada',
    };

    this.hotelService.crearReservaCompleta(payload).subscribe({
      next: (res: any) => {
        this.procesandoPago.set(false);
        this.router.navigate(['/'], { queryParams: { reservaExito: 'true' } });
      },
      error: (err: any) => {
        this.procesandoPago.set(false);
        alert(
          'Error al procesar la reserva en el servidor. Asegúrate de que hay habitaciones de este tipo disponibles para esas fechas.',
        );
      },
    });
  }
}
