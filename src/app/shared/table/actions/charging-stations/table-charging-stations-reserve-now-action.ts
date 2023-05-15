import { ComponentType } from '@angular/cdk/portal';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { CentralServerService } from 'services/central-server.service';
import { DialogService } from 'services/dialog.service';
import { MessageService } from 'services/message.service';
import { SpinnerService } from 'services/spinner.service';
import { ChargingStationsAuthorizations, DialogParamsWithAuth } from 'types/Authorization';
import { ChargePointStatus, ChargingStation, ChargingStationButtonAction, Connector, OCPPGeneralResponse } from 'types/ChargingStation';
import { ActionResponse } from 'types/DataResult';
import { ButtonAction, ButtonActionColor } from 'types/GlobalType';
import { ReserveNow, ReserveNowDialogData } from 'types/Reservation';
import { TableActionDef } from 'types/Table';
import { User } from 'types/User';
import { Utils } from 'utils/Utils';
import { TableAction } from '../table-action';

export interface TableChargingStationsReserveNowActionDef extends TableActionDef {
  action: (
    chargingStationReserveNowDialogComponent: ComponentType<unknown>,
    chargingStation: ChargingStation,
    connector: Connector,
    dialogService: DialogService,
    dialog: MatDialog,
    translateService: TranslateService,
    messageService: MessageService,
    centralServerService: CentralServerService,
    spinnerService: SpinnerService,
    router: Router,
    refresh?: () => Observable<void>
  ) => void;
}

export class TableChargingStationsReserveNowAction implements TableAction {
  private action: TableChargingStationsReserveNowActionDef = {
    id: ChargingStationButtonAction.RESERVE_NOW,
    type: 'button',
    icon: 'key',
    color: ButtonActionColor.ACCENT,
    name: 'reservations.general.reserve_now',
    tooltip: 'reservations.general.tooltips.reserve_now',
    action: this.reserveNow.bind(this),
  };

  public getActionDef(): TableChargingStationsReserveNowActionDef {
    return this.action;
  }

  private reserveNow(
    chargingStationsReserveNowDialogComponent: ComponentType<unknown>,
    chargingStation: ChargingStation,
    connector: Connector,
    dialogService: DialogService,
    dialog: MatDialog,
    translateService: TranslateService,
    messageService: MessageService,
    centralServerService: CentralServerService,
    spinnerService: SpinnerService,
    router: Router,
    refresh?: () => Observable<void>
  ) {
    if (chargingStation.inactive) {
      dialogService.createAndShowOkDialog(
        translateService.instant('reservations.action_error.reserve_now_title'),
        translateService.instant('reservations.action_error.reserve_now_title')
      );
      return;
    }
    if (connector.status === ChargePointStatus.UNAVAILABLE
      || connector.status === ChargePointStatus.RESERVED) {
      dialogService.createAndShowOkDialog(
        translateService.instant('reservations.action_error.reserve_now_title'),
        translateService.instant('reservations.action_error.reserve_now_not_available')
      );
      return;
    }
    if (connector.currentTransactionID) {
      dialogService.createAndShowOkDialog(
        translateService.instant('reservations.action_error.reserve_now_title'),
        translateService.instant('chargers.action_error.transaction_in_progress')
      );
      return;
    }
    // Create dialog config
    const dialogConfig = new MatDialogConfig();
    dialogConfig.minWidth = '40vw';
    dialogConfig.panelClass = '';
    // Build dialog data
    const dialogData: DialogParamsWithAuth<ReserveNowDialogData, ChargingStationsAuthorizations> = {
      dialogData: {
        id: chargingStation.id,
        chargingStation,
        connector,
        expiryDate: Utils.createDateWithDelay(0,1,0,0), // Provide a default expiration-date within 1 hour
        reservationID: Utils.createRandomId() // Provide a default reservationID in form of a random UUID
      },
    };
    dialogConfig.data = dialogData;
    // Show
    const dialogRef = dialog.open(chargingStationsReserveNowDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((reserveNow: ReserveNow) => {
      if (reserveNow) {
        this.reserveConnectorNowForUser(
          chargingStation,
          connector,
          reserveNow.user,
          reserveNow.expiryDate,
          reserveNow.tagID,
          reserveNow.reservationID,
          reserveNow.parentTagID,
          dialogService,
          translateService,
          messageService,
          centralServerService,
          router,
          spinnerService,
          refresh
        );
      }
    });
  }

  private reserveConnectorNowForUser(
    chargingStation: ChargingStation,
    connector: Connector,
    user: User,
    expiryDate: Date,
    tagId: string,
    reservationID: number,
    parentTagID: string,
    dialogService: DialogService,
    translateService: TranslateService,
    messageService: MessageService,
    centralServerService: CentralServerService,
    router: Router,
    spinnerService: SpinnerService,
    refresh?: () => Observable<void>
  ): void {
    dialogService
      .createAndShowYesNoDialog(
        translateService.instant('reservations.dialog.reserve_now_title'),
        translateService.instant('reservations.dialog.reserve_now_confirm', {
          chargeBoxID: chargingStation.id,
          connectorID: Utils.getConnectorLetterFromConnectorID(connector.connectorId),
          userName: Utils.buildUserFullName(user),
        })
      )
      .subscribe((response) => {
        if (response === ButtonAction.YES) {
          // Check badge
          if (!tagId) {
            messageService.showErrorMessage(
              translateService.instant('chargers.start_transaction_missing_active_tag', {
                chargeBoxID: chargingStation.id,
                userName: user.fullName,
              })
            );
            return;
          }
          spinnerService.show();
          centralServerService
            .reserveNow(chargingStation.id, connector.connectorId, expiryDate, tagId, reservationID, parentTagID)
            .subscribe({
              next: (reserveNowResponse: ActionResponse) => {
                spinnerService.hide();
                if (reserveNowResponse.status === OCPPGeneralResponse.ACCEPTED) {
                  messageService.showSuccessMessage(
                    translateService.instant('reservations.dialog.reserve_now_success', {
                      chargeBoxID: chargingStation.id,
                      connectorID: connector.connectorId
                    })
                  );
                  if (refresh) {
                    refresh().subscribe();
                  }
                } else {
                  Utils.handleError(
                    JSON.stringify(response),
                    messageService,
                    translateService.instant('reservations.dialog.reserve_now_error')
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
                  'reservations.dialog.reserve_now_error'
                );
              },
            });
        }
      });
  }
}
