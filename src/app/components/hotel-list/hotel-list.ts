import { Component, inject, signal } from '@angular/core';
import { HotelService } from '../../services/hotel';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-hotel-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hotel-list.html',
  styleUrl: './hotel-list.scss'
})
export class HotelList {
  private hotelService = inject(HotelService);

  private route = inject(ActivatedRoute);
  mostrarAlertaExito = signal<boolean>(false);

  // Obtenemos la señal del servicio
  listaHoteles = this.hotelService.hoteles;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['reservaExito'] === 'true') {
        this.mostrarAlertaExito.set(true);

        // Se oculta automáticamente a los 5 segundos
        setTimeout(() => this.mostrarAlertaExito.set(false), 5000);
      }
    });

  }
}
