import { AfterViewInit, Directive, ElementRef, HostListener, OnDestroy } from '@angular/core';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

@Directive({ selector: '[appFocusTrap]', standalone: true })
export class FocusTrapDirective implements AfterViewInit, OnDestroy {
  private previouslyFocused: HTMLElement | null = null;

  constructor(private host: ElementRef<HTMLElement>) {}

  public ngAfterViewInit(): void {
    this.previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    queueMicrotask(() => this.focusableElements()[0]?.focus());
  }

  public ngOnDestroy(): void {
    if (this.previouslyFocused?.isConnected) this.previouslyFocused.focus({ preventScroll: true });
  }

  @HostListener('keydown', ['$event'])
  public trapTab(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key !== 'Tab') return;
    const elements = this.focusableElements();
    if (!elements.length) return;
    const first = elements[0];
    const last = elements[elements.length - 1];
    const active = document.activeElement;
    if (keyboardEvent.shiftKey && active === first) {
      keyboardEvent.preventDefault();
      last.focus();
    } else if (!keyboardEvent.shiftKey && active === last) {
      keyboardEvent.preventDefault();
      first.focus();
    }
  }

  private focusableElements(): HTMLElement[] {
    return [...this.host.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE)]
      .filter((element) => !element.hasAttribute('hidden') && element.getClientRects().length > 0);
  }
}
