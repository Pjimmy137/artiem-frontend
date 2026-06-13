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

  // Modelo del Formulario de la captura
  nombre = signal<string>('');
  apellidos = signal<string>('');
  email = signal<string>('');
  telefono = signal<string>('');
  prefijo = signal<string>('+34');
  aceptaTerminos = signal<boolean>(false);

  // Estados de carga de la pasarela simulada
  procesandoPago = signal<boolean>(false);
  total = computed(() => this.datosReserva()?.precio_total || 0);
  pagoAhora = computed(() => Number((this.total() * 0.3).toFixed(2)));
  pagoEnHotel = computed(() => Number((this.total() * 0.7).toFixed(2)));

  ngOnInit() {
    // Si el usuario refresca la página de golpe y se vacía el servicio, lo devolvemos al inicio
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

  // Comprobación rápida de validación de campos obligatorios
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
    const formatear = (d: Date) => d.toISOString().split('T')[0];

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
      extras: this.datosReserva().extras.map((e: any) => e.id),
      monto_total: this.total(),
      monto_pagado_online: this.pagoAhora(),
      estado: 'confirmada',
    };

    // Llamamos a Laravel para que busque habitación física libre, guarde cliente y cree la reserva
    this.hotelService.crearReservaCompleta(payload).subscribe({
      next: (res: any) => {
        // 🌟 Añadido : any para silenciar el error de TS
        this.procesandoPago.set(false);
        // Redirigimos a la Home enviando un flag de éxito en el estado de la ruta
        this.router.navigate(['/'], { queryParams: { reservaExito: 'true' } });
      },
      error: (err: any) => {
        // 🌟 Añadido : any para silenciar el error de TS
        this.procesandoPago.set(false);
        alert(
          'Error al procesar la reserva en el servidor. Asegúrate de que hay habitaciones de este tipo disponibles para esas fechas.',
        );
      },
    });
  }
}
