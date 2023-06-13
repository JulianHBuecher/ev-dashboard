import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { StatusCodes } from 'http-status-codes';
import { CentralServerService } from 'services/central-server.service';
import { DialogService } from 'services/dialog.service';
import { LocaleService } from 'services/locale.service';
import { MessageService } from 'services/message.service';
import { SpinnerService } from 'services/spinner.service';
import { UtilsService } from 'services/utils.service';
import { DialogMode, ReservationsAuthorizations } from 'types/Authorization';
import { KeyValue, RestResponse } from 'types/GlobalType';
import { HTTPError } from 'types/HTTPError';
import { Reservation } from 'types/Reservation';
import { Utils } from 'utils/Utils';

@Component({
  selector: 'app-reservation',
  templateUrl: 'reservation.component.html',
  styleUrls: ['reservation.component.scss']
})
export class ReservationComponent implements OnInit {
  @Input() public reservationId!: number;
  @Input() public dialogRef!: MatDialogRef<any>;
  @Input() public dialogMode!: DialogMode;
  @Input() public reservationsAuthorizations!: ReservationsAuthorizations;

  public formGroup: UntypedFormGroup;
  public reservation: Reservation;
  public userLocales: KeyValue[];
  public isProdLandscape!: boolean;

  public canUpdate: boolean;
  public readOnly = true;
  public canCancel: boolean;
  public canDelete: boolean;
  public activeTabIndex = 0;

  public constructor(
    private spinnerService: SpinnerService,
    private centralServerService: CentralServerService,
    private messageService: MessageService,
    private translateService: TranslateService,
    private localeService: LocaleService,
    private dialogService: DialogService,
    protected activatedRoute: ActivatedRoute,
    private utilsService: UtilsService,
    private router: Router
  ) {
    this.userLocales = this.localeService.getLocales();
    this.formGroup = new UntypedFormGroup({});
  }

  public ngOnInit() {
    this.isProdLandscape = this.utilsService.isProdLandscape();
    this.readOnly = this.dialogMode === DialogMode.VIEW;
    Utils.handleDialogMode(this.dialogMode, this.formGroup);
    this.loadReservation();
  }

  public loadReservation() {
    if (this.reservationId) {
      this.spinnerService.show();
      this.centralServerService.getReservation(this.reservationId).subscribe({
        next: (reservation: Reservation) => {
          this.spinnerService.hide();
          this.reservation = reservation;
          if (this.readOnly) {
            setTimeout(() => this.formGroup.disable(), 0);
          }
          this.formGroup.updateValueAndValidity();
          this.formGroup.markAsPristine();
          this.formGroup.markAllAsTouched();
        },
        error: (error) => {
          this.spinnerService.hide();
          switch (error.status) {
            case StatusCodes.NOT_FOUND:
              this.messageService.showErrorMessage('reservations.reservation_not_found');
              break;
            default:
              Utils.handleHttpError(error, this.router, this.messageService, this.centralServerService,
                'reservations.reservation_not_found');
          }
        }
      });
    }
  }

  public saveReservation(reservation: Reservation) {
    // Clone
    const reservationToSave = Utils.cloneObject(reservation) as Reservation;
    // Save
    this.spinnerService.show();
    this.centralServerService.updateReservation(reservationToSave).subscribe({
      next: (response) => {
        this.spinnerService.hide();
        if (response.status === RestResponse.SUCCESS) {
          this.messageService.showSuccessMessage('reservations.change_reservation_success', { reservationId: this.reservationId });
          this.closeDialog(true);
        } else {
          this.messageService.showErrorMessage('reservations.change_reservation_error');
        }
      },
      error: (error) => {
        this.spinnerService.hide();
        switch (error.status) {
          case StatusCodes.NOT_FOUND:
            this.messageService.showErrorMessage('reservations.change_reservation_error');
            break;
          case HTTPError.FEATURE_NOT_SUPPORTED_ERROR:
            this.messageService.showErrorMessage('reservations.update_reservation_error');
            break;
          default:
            Utils.handleHttpError(error, this.router, this.messageService,
              this.centralServerService, 'reservations.change_reservation_error');
        }
      }
    });
  }

  public changeActivePane(tabChangedEvent: MatTabChangeEvent) {
    this.activeTabIndex = tabChangedEvent.index;
  }

  public closeDialog(saved: boolean = false) {
    if (this.dialogRef) {
      this.dialogRef.close(saved);
    }
  }
  public close() {
    Utils.checkAndSaveAndCloseDialog(this.formGroup, this.dialogService, this.translateService,
      this.saveReservation.bind(this), this.closeDialog.bind(this));
  }
}
