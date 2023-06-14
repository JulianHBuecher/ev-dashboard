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

export interface TableCancelReservationActionDef extends TableActionDef {
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

export class TableCancelReservationAction extends TableDeleteAction {
  public getActionDef(): TableCancelReservationActionDef {
    return {
      ...super.getActionDef(),
      id: ReservationButtonAction.CANCEL_RESERVATION,
      action: this.cancelReservation,
    };
  }

  private cancelReservation(
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
      'reservations.cancel_title',
      translateService.instant('reservations.cancel_confirm', { reservationID: reservation.id }),
      translateService.instant('reservations.cancel_success', { reservationID: reservation.id }),
      'reservations.cancel_error',
      centralServerService.cancelReservation.bind(centralServerService),
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
