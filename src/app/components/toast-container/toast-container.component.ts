import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start p-4 rounded-2xl shadow-soft border transition-all duration-300 transform animate-slide-up backdrop-blur-md"
          [ngClass]="{
            'bg-white/95 border-emerald-100 text-stone-800': toast.type === 'success',
            'bg-white/95 border-amber-100 text-stone-800': toast.type === 'warning',
            'bg-white/95 border-rose-100 text-stone-800': toast.type === 'error',
            'bg-white/95 border-stone-200 text-stone-800': toast.type === 'info'
          }"
        >
          <!-- Icon -->
          <div class="flex-shrink-0 mr-3 mt-0.5">
            @if (toast.type === 'success') {
              <div class="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            } @else if (toast.type === 'warning') {
              <div class="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            } @else if (toast.type === 'error') {
              <div class="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            } @else {
              <div class="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            }
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 pr-2">
            <h4 class="text-sm font-semibold text-stone-900 leading-tight">{{ toast.title }}</h4>
            @if (toast.message) {
              <p class="text-xs text-stone-500 mt-0.5 leading-relaxed">{{ toast.message }}</p>
            }
          </div>

          <!-- Dismiss button -->
          <button
            (click)="toastService.remove(toast.id)"
            class="text-stone-400 hover:text-stone-600 p-1 rounded-lg transition-colors"
            aria-label="Cerrar notificación"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  public toastService = inject(ToastService);
}
