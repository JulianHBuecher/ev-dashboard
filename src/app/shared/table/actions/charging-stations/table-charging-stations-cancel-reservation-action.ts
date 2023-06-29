import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { ButtonAction, ButtonActionColor } from 'types/GlobalType';
import { CentralServerService } from 'services/central-server.service';
import { DialogService } from 'services/dialog.service';
import { MessageService } from 'services/message.service';
import { SpinnerService } from 'services/spinner.service';
import {
  ChargePointStatus,
  ChargingStation,
  ChargingStationButtonAction,
  Connector,
  OCPPGeneralResponse,
} from 'types/ChargingStation';
import { TableActionDef } from 'types/Table';
import { ActionResponse } from 'types/DataResult';
import { Utils } from 'utils/Utils';
import { Reservation } from 'types/Reservation';
import { TableAction } from '../table-action';

export interface TableChargingStationsCancelReservationActionDef extends TableActionDef {
  action: (
    // chargingStationCancelReservationDialogComponent: ComponentType<unknown>,
    chargingStation: ChargingStation,
    connector: Connector,
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

export class TableChargingStationsCancelReservationAction implements TableAction {
  private action: TableChargingStationsCancelReservationActionDef = {
    id: ChargingStationButtonAction.CANCEL_RESERVATION,
    type: 'button',
    icon: 'key_off',
    color: ButtonActionColor.ACCENT,
    name: 'reservations.dialog.cancel_reservation.title',
    tooltip: 'reservations.dialog.cancel_reservation.tooltip',
    action: this.cancelReservation.bind(this),
  };

  public getActionDef(): TableChargingStationsCancelReservationActionDef {
    return this.action;
  }

  private cancelReservation(
    chargingStation: ChargingStation,
    connector: Connector,
    reservation: Reservation,
    dialogService: DialogService,
    translateService: TranslateService,
    messageService: MessageService,
    centralServerService: CentralServerService,
    spinnerService: SpinnerService,
    router: Router,
    refresh?: () => Observable<void>
  ) {
    if (chargingStation.inactive) {
      dialogService.createAndShowOkDialog(
        translateService.instant('reservations.action_error.cancel_reservation.title'),
        translateService.instant('reservations.action_error.cancel_reservation.title')
      );
      return;
    }
    if (connector.status === ChargePointStatus.UNAVAILABLE) {
      dialogService.createAndShowOkDialog(
        translateService.instant('reservations.action_error.cancel_reservation.title'),
        translateService.instant('reservations.action_error.cancel_reservation.not_available')
      );
      return;
    }

    dialogService
      .createAndShowYesNoDialog(
        translateService.instant('reservations.dialog.cancel_reservation.title'),
        translateService.instant('reservations.dialog.cancel_reservation.confirm', {
          chargingStationId: chargingStation.id,
          reservationId: reservation.id,
        })
      )
      .subscribe((response) => {
        if (response === ButtonAction.YES) {
          spinnerService.show();
          centralServerService.cancelReservation(chargingStation.id, reservation.id).subscribe({
            next: (cancelReservationResponse: ActionResponse) => {
              spinnerService.hide();
              if (cancelReservationResponse.status === OCPPGeneralResponse.ACCEPTED) {
                messageService.showSuccessMessage(
                  translateService.instant('reservations.dialog.cancel_reservation.success', {
                    reservationID: reservation.id,
                    chargingStationD: chargingStation.id,
                  })
                );
                if (refresh) {
                  refresh().subscribe();
                }
              } else {
                Utils.handleError(
                  JSON.stringify(response),
                  messageService,
                  translateService.instant('reservations.dialog.cancel_reservation.error', {
                    reservationID: reservation.id,
                    chargingStationD: chargingStation.id,
                  })
                );
              }
            },
            error: (error) => {
              spinnerService.hide();
              Utils.handleHttpError(
                error,
                router,
                messageService,
                centralServerService,
                translateService.instant('reservations.dialog.cancel_reservation.error', {
                  reservationID: reservation.id,
                  chargingStationD: chargingStation.id,
                })
              );
            },
          });
        }
      });
  }
}
