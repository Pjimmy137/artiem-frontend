import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  // Almacén temporal de la sesión de reserva actual
  reservaActual = signal<any>(null);

}
