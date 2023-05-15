import { ComponentType } from '@angular/cdk/portal';
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
import { User } from 'types/User';
import { Reservation } from 'types/Reservation';
import { TableAction } from '../table-action';

export interface TableChargingStationsCancelReservationActionDef extends TableActionDef {
  action: (
    chargingStationCancelReservationDialogComponent: ComponentType<unknown>,
    chargingStation: ChargingStation,
    connector: Connector,
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
    name: 'reservations.general.cancel_reservation',
    tooltip: 'reservations.general.tooltips.cancel_reservation',
    action: this.cancelReservation.bind(this),
  };

  public getActionDef(): TableChargingStationsCancelReservationActionDef {
    return this.action;
  }

  private cancelReservation(
    chargingStationsCancelReservationDialogComponent: ComponentType<unknown>,
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
        translateService.instant('reservations.action_error.cancel_reservation_title'),
        translateService.instant('reservations.action_error.cancel_reservation_title')
      );
      return;
    }
    if (connector.status === ChargePointStatus.UNAVAILABLE) {
      dialogService.createAndShowOkDialog(
        translateService.instant('reservations.action_error.cancel_reservation_title'),
        translateService.instant('reservations.action_error.cancel_reservation_not_available')
      );
      return;
    }

    let user: User;

    dialogService.createAndShowYesNoDialog(
      translateService.instant('reservations.dialog.cancel_reservation_title'),
      translateService.instant('reservations.dialog.cancel_reservation_confirm', {
        userName: Utils.buildUserFullName(user),
        chargeBoxID: chargingStation.id,
        reservationID: reservation.id,
      })
    ).subscribe((response) => {
      if (response === ButtonAction.YES) {
        spinnerService.show();
        centralServerService
        // TODO: Get Reservation ID from Template
          .cancelReservation(chargingStation.id,0)
          .subscribe({
            next: (cancelReservationResponse: ActionResponse) => {
              spinnerService.hide();
              if (cancelReservationResponse.status === OCPPGeneralResponse.ACCEPTED) {
                messageService.showSuccessMessage(translateService.instant('', { }));
                if (refresh) {
                  refresh().subscribe();
                }
              } else {
                Utils.handleError(
                  JSON.stringify(response),
                  messageService,
                  translateService.instant('reservations.dialog.cancel_reservation_error')
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
                'reservations.dialog.cancel_reservation_error'
              );
            }
          });
      }
    });
  }
}
