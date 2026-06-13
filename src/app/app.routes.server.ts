import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'hoteles/:id',
    renderMode: RenderMode.Client // 🌟 Esto le dice a Angular: "No busques parámetros al compilar, cárgalo en el cliente".
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
