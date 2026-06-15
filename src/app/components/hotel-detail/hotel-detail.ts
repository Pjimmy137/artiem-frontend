import { Component, computed, effect, inject, Input, OnInit, signal } from '@angular/core';
import { HotelService } from '../../services/hotel';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-hotel-detail',
  standalone: true,
  imports: [RouterLink, UpperCasePipe, CommonModule],
  templateUrl: './hotel-detail.html',
  styleUrl: './hotel-detail.css',
})
export class HotelDetail implements OnInit {
  private hotelService = inject(HotelService);

  // Transformamos tu @Input en una propiedad que se actualice dinámicamente
  private _id!: string;
  @Input()
  set id(value: string) {
    this._id = value;
    this.idSignal.set(Number(value)); // Cada vez que el navbar cambie la URL, la señal se entera
  }
  get id(): string {
    return this._id;
  }

  // Creamos una señal interna para el ID del hotel
  idSignal = signal<number>(0);

  constructor() {
    // 🌟 El truco mágico: effect() se ejecuta automáticamente CADA VEZ que 'idSignal' cambie
    effect(() => {
      const idActual = this.idSignal();
      if (idActual > 0) {
        this.hotelService.getHotelById(idActual).subscribe({
          next: (datos) => this.hotel.set(datos),
          error: (err) => console.error('Error al traer el detalle:', err),
        });
      }
    });
  }

  // Señal para controlar los datos del hotel de forma reactiva
  hotel = signal<any>({
    nombre: 'Artiem Audax',
    habitaciones: [
      {
        id: 1,
        numero: '101',
        tipo_habitacion: 'Doble con vista al mar',
        precio_noche: 165,
        estado_disponibilidad: 'disponible',
      },
      {
        id: 2,
        numero: '102',
        tipo_habitacion: 'Doble con vista al mar',
        precio_noche: 165,
        estado_disponibilidad: 'disponible',
      },
      {
        id: 3,
        numero: '103',
        tipo_habitacion: 'Habitación solidaria',
        precio_noche: 120,
        estado_disponibilidad: 'disponible',
      },
      {
        id: 4,
        numero: '104',
        tipo_habitacion: 'Habitación solidaria',
        precio_noche: 120,
        estado_disponibilidad: 'ocupado',
      }, // Una ocupada
      // ... Imagina las otras 26 aquí metidas
    ],
  });

  // 1. SIGNALS DE ESTADO DE LA RESERVA
  tipoSeleccionado = signal<any>(null); // Guardará el tipo de habitación elegido
  fechaEntrada = signal<Date | null>(null);
  fechaSalida = signal<Date | null>(null);

  mostrarModalExtras = signal<boolean>(false);
  extrasSeleccionados = signal<any[]>([]);

  private bookingService = inject(BookingService);
  private router = inject(Router);

  // 2. SIGNALS PARA EL CALENDARIO PROPIO (Mes actual por defecto)
  mesActual = signal<number>(new Date().getMonth());
  anioActual = signal<number>(new Date().getFullYear());
  serviciosWellness = signal<any[]>([]);
  nombresDias = ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'];
  nombresMeses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  tiposDeHabitacion = computed(() => {
    const todasLasHabs = this.hotel()?.habitaciones || [];
    const agrupacion = new Map<string, { tipo: string; precio: number; stock: number }>();

    todasLasHabs.forEach((hab: any) => {
      if (!agrupacion.has(hab.tipo_habitacion)) {
        agrupacion.set(hab.tipo_habitacion, {
          tipo: hab.tipo_habitacion,
          precio: Number(hab.precio_noche),
          stock: 0,
        });
      }

      // Solo sumamos al stock si la habitación física está realmente disponible
      if (hab.estado_disponibilidad === 'disponible') {
        agrupacion.get(hab.tipo_habitacion)!.stock++;
      }
    });

    return Array.from(agrupacion.values());
  });

  // 3. GENERADOR ARTESANAL DE DÍAS DEL MES (Para el Grid)
  diasDelCalendario = computed(() => {
    const año = this.anioActual();
    const mes = this.mesActual();
    const primerDiaMes = new Date(año, mes, 1);
    const ultimoDiaMes = new Date(año, mes + 1, 0);

    const dias = [];

    // Huecos al principio de la semana (Lunes = 1, Domingo = 0)
    let diaSemanaInicial = primerDiaMes.getDay();
    if (diaSemanaInicial === 0) diaSemanaInicial = 7; // Ajustar Domingo
    for (let i = 1; i < diaSemanaInicial; i++) {
      dias.push(null);
    }

    // Rellenar con los días reales del mes
    for (let d = 1; d <= ultimoDiaMes.getDate(); d++) {
      dias.push(new Date(año, mes, d));
    }

    return dias;
  });

  // 4. LÓGICA DE SELECCIÓN DE RANGOS DEL CALENDARIO
  seleccionarDia(dia: Date | null) {
    if (!dia) return;

    const entrada = this.fechaEntrada();
    const salida = this.fechaSalida();

    if (!entrada || (entrada && salida)) {
      this.fechaEntrada.set(dia);
      this.fechaSalida.set(null);
    } else if (dia > entrada) {
      this.fechaSalida.set(dia);
    } else {
      this.fechaEntrada.set(dia);
    }
  }

  // Helpers estéticos para iluminar el rango en el HTML
  esDiaSeleccionado(dia: Date | null): boolean {
    if (!dia) return false;
    return (
      this.compararFechas(dia, this.fechaEntrada()) || this.compararFechas(dia, this.fechaSalida())
    );
  }

  estaEnRango(dia: Date | null): boolean {
    if (!dia || !this.fechaEntrada() || !this.fechaSalida()) return false;
    return dia > this.fechaEntrada()! && dia < this.fechaSalida()!;
  }

  private compararFechas(d1: Date | null, d2: Date | null): boolean {
    if (!d1 || !d2) return false;
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  }

  precioTotal = computed(() => {
    const hab = this.tipoSeleccionado();
    const noches = this.numeroNoches();
    const costeEstancia = hab && noches > 0 ? Number(hab.precio) * Number(noches) : 0;

    console.log('--- DIAGNÓSTICO DE PRECIOS ---');
    console.log('Coste Estancia Calculado:', costeEstancia);
    console.log('Array de Extras Seleccionados:', this.extrasSeleccionados());

    const costeExtras = this.extrasSeleccionados().reduce((total, extra) => {
      // Este log te dirá exactamente qué estructura tiene el objeto en producción
      console.log('Objeto Extra individual dentro del reduce:', extra);

      const precio = extra && extra.precio_extra ? Number(extra.precio_extra) : 0;
      return total + precio;
    }, 0);

    console.log('Coste Total Extras Calculado:', costeExtras);
    return costeEstancia + costeExtras;
  });
  // MÉTODOS DE CONTROL PARA EL MODAL Y EXTRAS
  abrirModalExtras() {
    if (this.numeroNoches() > 0 && this.tipoSeleccionado()) {
      this.mostrarModalExtras.set(true);
    }
  }

  cerrarModalExtras() {
    this.mostrarModalExtras.set(false);
  }

  toggleExtra(extra: any) {
    const seleccionados = this.extrasSeleccionados();
    const existe = seleccionados.find(item => item.id_servicio === extra.id_servicio);

    if (existe) {
      // Si ya estaba, lo quitamos
      this.extrasSeleccionados.set(seleccionados.filter(item => item.id_servicio !== extra.id_servicio));
    } else {
      // Si no estaba, lo añadimos
      this.extrasSeleccionados.set([...seleccionados, extra]);
    }
  }

  esExtraSeleccionado(extraId: number): boolean {
    return this.extrasSeleccionados().some(item => item.id_servicio === extraId);
  }

  // El botón definitivo dentro del modal ejecuta el envío final a Laravel
  finalizarReservaConTodo() {
  this.bookingService.reservaActual.set({
    hotel_id: Number(this.id),
    hotel_nombre: this.hotel().nombre,
    tipo_habitacion: this.tipoSeleccionado().tipo,
    precio_habitacion: this.tipoSeleccionado().precio,
    fecha_entrada: this.fechaEntrada(),
    fecha_salida: this.fechaSalida(),
    noches: this.numeroNoches(),
    extras: this.extrasSeleccionados(),
    precio_total: this.precioTotal()
  });

  this.cerrarModalExtras();
  this.router.navigate(['/checkout']); // Nos vamos al nuevo componente
}

  // 5. CÓMPUTOS FINALES REACTIVOS
  numeroNoches = computed(() => {
    const ent = this.fechaEntrada();
    const sal = this.fechaSalida();
    if (!ent || !sal) return 0;
    return Math.ceil((sal.getTime() - ent.getTime()) / (1000 * 60 * 60 * 24));
  });

  cambiarMes(direccion: number) {
    let nuevoMes = this.mesActual() + direccion;
    if (nuevoMes > 11) {
      this.mesActual.set(0);
      this.anioActual.update((a) => a + 1);
    } else if (nuevoMes < 0) {
      this.mesActual.set(11);
      this.anioActual.update((a) => a - 1);
    } else {
      this.mesActual.set(nuevoMes);
    }
  }

  ngOnInit() {

    this.hotelService.obtenerServiciosWellness().subscribe({
      next: (servicios) => {
        this.serviciosWellness.set(servicios);
      },
      error: (err) => {
        console.error('Error al cargar los servicios wellness', err);
      }
    });
  }
}
