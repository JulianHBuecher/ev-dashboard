import { Observable } from 'rxjs';
import { Reservation, ReservationButtonAction } from 'types/Reservation';
import { TableActionDef } from 'types/Table';
import { DialogService } from 'services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'services/message.service';
import { CentralServerService } from 'services/central-server.service';
import { SpinnerService } from 'services/spinner.service';
import { Router } from '@angular/router';
import { TableDeleteAction } from '../table-delete-action';

export interface TableDeleteReservationActionDef extends TableActionDef {
  action: (
    reservation: Reservation,
    dialogService: DialogService,
    translateService: TranslateService,
    messageService: MessageService,
    centralServerService: CentralServerService,
    spinnerService: SpinnerService,
    router: Router,
    refresh?: () => Observable<void>
  ) => void;
}

export class TableDeleteReservationAction extends TableDeleteAction {
  public getActionDef(): TableDeleteReservationActionDef {
    return {
      ...super.getActionDef(),
      id: ReservationButtonAction.DELETE_RESERVATION,
      action: this.deleteReservation,
    };
  }

  private deleteReservation(
    reservation: Reservation,
    dialogService: DialogService,
    translateService: TranslateService,
    messageService: MessageService,
    centralServerService: CentralServerService,
    spinnerService: SpinnerService,
    router: Router,
    refresh?: () => Observable<void>
  ) {
    super.delete(
      reservation,
      'reservations.delete_title',
      translateService.instant('reservations.delete_confirm', { reservationID: reservation.id }),
      translateService.instant('reservations.delete_success', { reservationID: reservation.id }),
      'reservations.delete_error',
      centralServerService.deleteReservation.bind(centralServerService),
      dialogService,
      translateService,
      messageService,
      centralServerService,
      spinnerService,
      router,
      refresh
    );
  }
}
