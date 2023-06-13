import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthorizationService } from 'services/authorization.service';
import { WindowService } from 'services/window.service';
import { AbstractTabComponent } from 'shared/component/abstract-tab/abstract-tab.component';

@Component({
  selector: 'app-reservations',
  templateUrl: 'reservations.component.html',
})
export class ReservationsComponent extends AbstractTabComponent {
  public canListReservations: boolean;

  public constructor(
    private authorizationService: AuthorizationService,
    activatedRoute: ActivatedRoute,
    windowService: WindowService
  ) {
    super(activatedRoute,windowService,['reservations']);
    // TODO: Implementation regarding access control for listing reservationns
    this.canListReservations = true; // this.authorizationService.canListReservations();
  }
}
