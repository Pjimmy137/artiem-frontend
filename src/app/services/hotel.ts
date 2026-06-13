import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private http = inject(HttpClient);
  private url = 'http://127.0.0.1:8000/api/hoteles';

  // 1. Este "gatillo" emitirá un evento cada vez que queramos actualizar la lista
  private refrescar$ = new BehaviorSubject<void>(undefined);

  // 2. Cada vez que el gatillo se active, hacemos el HTTP GET dinámicamente
  private hoteles$ = this.refrescar$.pipe(
    switchMap(() => this.http.get<any[]>(this.url))
  );

  // 3. Convertimos ese flujo reactivo en la SEÑAL que lee tu HTML
  hoteles = toSignal(this.hoteles$, { initialValue: [] });

  // 4. El método mágico: limpia la recámara y obliga a pedir datos nuevos
  recargarHoteles() {
    this.refrescar$.next();
  }

  obtenerServiciosWellness(): Observable<any[]> {
  return this.http.get<any[]>(`${this.url}/servicios-wellness`);
}

  crearHotel(nuevoHotel: any) {
    return this.http.post<any>(this.url, nuevoHotel);
  }

  // Método para obtener un solo hotel usando su ID
  getHotelById(id: number): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}`);
  }

  crearReservaCompleta(payload: any): Observable<any> {
    return this.http.post<any>(`${this.url}/reservas`, payload);
  }
}
