import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HotelService } from '../../services/hotel';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hotel-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './hotel-form.html',
  styleUrl: './hotel-form.css'
})
export class HotelForm {
  private fb = inject(FormBuilder);
  private hotelService = inject(HotelService);
  private router = inject(Router);

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    direccion: ['', Validators.required],
    ciudad: ['', Validators.required],
    fotoUrl: ['', Validators.required]
  });

  guardar() {
  if (this.form.invalid) return;

    const datosEnvio = {
      nombre: this.form.value.nombre,
      direccion: this.form.value.direccion,
      ciudad: this.form.value.ciudad,
      galeria_fotos: [this.form.value.fotoUrl]
    };

    this.hotelService.crearHotel(datosEnvio).subscribe({
      next: () => {
        // 🌟 AQUÍ ESTÁ LA MAGIA: Avisamos al servicio para que refresque los datos
        this.hotelService.recargarHoteles();

        alert('¡Hotel Artiem añadido con éxito!');
        this.router.navigate(['/hoteles']);
        },
        error: (err) => console.error('Error al guardar en Laravel:', err)
    });
  }
}
