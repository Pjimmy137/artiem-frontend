import { Routes } from '@angular/router';
import { HotelList } from './components/hotel-list/hotel-list'; // Ajusta la ruta si es distinta
import { HotelForm } from './components/hotel-form/hotel-form';
import { HotelDetail } from './components/hotel-detail/hotel-detail';
import { BookingCheckoutComponent } from './components/booking-checkout/booking-checkout';

export const routes: Routes = [
  { path: 'hoteles', component: HotelList },
  { path: 'hoteles/nuevo', component: HotelForm },
  { path: 'hoteles/:id', component: HotelDetail },
  { path: '', redirectTo: 'hoteles', pathMatch: 'full' },
  { path: 'hotel/capri', component: HotelDetail, data: { idHotel: 7 } },
  { path: 'hotel/carlos', component: HotelDetail, data: { idHotel: 12 } },
  { path: 'hotel/audax', component: HotelDetail, data: { idHotel: 8 } },
  { path: 'hotel/madrid', component: HotelDetail, data: { idHotel: 1 } },
  { path: 'hotel/asturias', component: HotelDetail, data: { idHotel: 11 } },
  { path: 'checkout', component: BookingCheckoutComponent },
];
