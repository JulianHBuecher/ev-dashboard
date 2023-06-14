import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import {
  AbstractControl,
  UntypedFormControl,
  UntypedFormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { CentralServerService } from 'services/central-server.service';
import { ComponentService } from 'services/component.service';
import { DialogService } from 'services/dialog.service';
import { LocaleService } from 'services/locale.service';
import { SpinnerService } from 'services/spinner.service';
import { TagsDialogComponent } from 'shared/dialogs/tags/tags-dialog.component';
import { UsersDialogComponent } from 'shared/dialogs/users/users-dialog.component';
import { ReservationsAuthorizations } from 'types/Authorization';
import { ChargingStation, Connector } from 'types/ChargingStation';
import { KeyValue } from 'types/GlobalType';
import { Reservation } from 'types/Reservation';
import { Tag } from 'types/Tag';
import { StartTransactionErrorCode } from 'types/Transaction';
import { User, UserSessionContext } from 'types/User';
import { Utils } from 'utils/Utils';

@Component({
  selector: 'app-reservation-parameters',
  templateUrl: 'reservation-parameters.component.html',
  styleUrls: ['reservation-parameters.component.scss'],
})
export class ReservationParametersComponent implements OnInit, OnChanges {
  @Input() public reservation!: Reservation;
  @Input() public formGroup: UntypedFormGroup;
  @Input() public readOnly: boolean;
  @Input() public reservationsAuthorizations: ReservationsAuthorizations;

  public userLocales: KeyValue[];

  public id!: AbstractControl;
  public chargingStationId!: AbstractControl;
  public connectorId!: AbstractControl;
  public expiryDate!: AbstractControl;
  public fromDate!: AbstractControl;
  public toDate!: AbstractControl;
  public user!: AbstractControl;
  public userId!: AbstractControl;
  public tag!: AbstractControl;
  public idTag!: AbstractControl;
  public parentIdTag!: AbstractControl;
  public status!: AbstractControl;
  public type!: AbstractControl;

  private initialized: boolean;
  private selectedUser: User;
  private selectedTag: Tag;
  private selectedChargingStation: ChargingStation;
  private selectedConnector: Connector;

  public constructor(
    private componentService: ComponentService,
    private spinnerService: SpinnerService,
    private centralServerService: CentralServerService,
    private translateService: TranslateService,
    private localeService: LocaleService,
    private dialogService: DialogService,
    private dialog: MatDialog
  ) {
    this.initialized = false;
    this.userLocales = this.localeService.getLocales();
  }

  public ngOnInit(): void {
    this.formGroup = new UntypedFormGroup({
      id: new UntypedFormControl(false),
      chargingStationId: new UntypedFormControl('', Validators.compose([Validators.required])),
      connectorId: new UntypedFormControl('', Validators.compose([Validators.required])),
      expiryDate: new UntypedFormControl('', Validators.compose([Validators.required])),
      fromDate: new UntypedFormControl('', Validators.compose([Validators.required])),
      toDate: new UntypedFormControl('', Validators.compose([Validators.required])),
      user: new UntypedFormControl('', Validators.compose([Validators.required])),
      userId: new UntypedFormControl('', Validators.compose([Validators.required])),
      tag: new UntypedFormControl(
        '',
        Validators.compose([Validators.required, this.tagActiveValidator.bind(this)])
      ),
      idTag: new UntypedFormControl(Validators.compose([Validators.required])),
      parentIdTag: new UntypedFormControl(Validators.compose([Validators.required])),
      status: new UntypedFormControl(Validators.compose([Validators.required])),
      type: new UntypedFormControl(Validators.compose([Validators.required])),
    });
    if (this.readOnly) {
      this.formGroup.disable();
    }
    this.id = this.formGroup.controls['id'];
    this.id.disable();
    this.chargingStationId = this.formGroup.controls['chargingStationId'];
    this.connectorId = this.formGroup.controls['connectorId'];
    this.expiryDate = this.formGroup.controls['expiryDate'];
    this.fromDate = this.formGroup.controls['fromDate'];
    this.toDate = this.formGroup.controls['toDate'];
    this.user = this.formGroup.controls['user'];
    this.userId = this.formGroup.controls['userId'];
    this.tag = this.formGroup.controls['tag'];
    this.idTag = this.formGroup.controls['idTag'];
    this.parentIdTag = this.formGroup.controls['parentIdTag'];
    this.status = this.formGroup.controls['status'];
    this.type = this.formGroup.controls['type'];
    this.initialized = true;
    this.loadReservation();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.loadReservation();
  }

  public loadReservation() {
    if (this.initialized && this.reservation) {
      this.id.setValue(this.reservation.id);
      this.chargingStationId.setValue(this.reservation.chargingStationId);
      this.connectorId.setValue(
        Utils.getConnectorLetterFromConnectorID(this.reservation.connectorId)
      );
      this.expiryDate.setValue(this.reservation.expiryDate);
      this.fromDate.setValue(this.reservation.fromDate);
      this.toDate.setValue(this.reservation.toDate);
      this.userId.setValue(this.reservation.userId);
      this.idTag.setValue(this.reservation.idTag);
      this.parentIdTag.setValue(this.reservation.parentIdTag);
      this.status.setValue(this.reservation.status);
      this.type.setValue(this.reservation.type);
      this.loadTag();
      this.loadUserSessionContext();
      this.loadChargingStation();
    }
  }

  public assignUser() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = 'transparent-dialog-container';
    // Set data
    dialogConfig.data = {
      rowMultipleSelection: false,
      staticFilter: {
        Issuer: true,
      },
    };
    // Show
    const dialogRef = this.dialog.open(UsersDialogComponent, dialogConfig);
    // Register to the answer
    dialogRef.afterClosed().subscribe((result) => {
      this.userId.setValue(result[0].key);
      this.user.setValue(Utils.buildUserFullName(result[0].objectRef));
      this.tag.setValue('');
      this.idTag.setValue('');
      this.loadUserSessionContext();
    });
  }

  public loadUserSessionContext() {
    if (this.userId.value) {
      this.spinnerService.show();
      this.centralServerService
        .getUserSessionContext(
          this.userId.value,
          this.chargingStationId.value,
          this.connectorId.value
        )
        .subscribe({
          next: (userSessionContext: UserSessionContext) => {
            this.spinnerService.hide();
            this.selectedTag = userSessionContext.tag;
            this.idTag.setValue(
              userSessionContext.tag ? Utils.buildTagName(userSessionContext.tag) : ''
            );
            this.formGroup.updateValueAndValidity();
            if (Utils.isEmptyArray(userSessionContext.errorCodes)) {
              this.formGroup.markAsPristine();
              this.formGroup.markAllAsTouched();
            } else {
              this.formGroup.setErrors(userSessionContext.errorCodes);
              if (
                userSessionContext.errorCodes[0] ===
                StartTransactionErrorCode.BILLING_NO_PAYMENT_METHOD
              ) {
                this.dialogService.createAndShowOkDialog(
                  this.translateService.instant('transactions.error_start_no_payment_method'),
                  this.translateService.instant('transactions.error_start_no_payment_method')
                );
              } else {
                this.dialogService.createAndShowOkDialog(
                  this.translateService.instant('transactions.error_start_general'),
                  this.translateService.instant('transactions.error_start_general')
                );
              }
            }
          },
          error: (error) => {
            this.spinnerService.hide();
            this.dialogService.createAndShowOkDialog(
              this.translateService.instant('general.error_backend'),
              error
            );
          },
        });
    }
  }

  public loadChargingStation() {
    if (this.chargingStationId.value) {
      this.spinnerService.show();
      this.centralServerService.getChargingStation(this.chargingStationId.value).subscribe({
        next: (chargingStation: ChargingStation) => {
          this.spinnerService.hide();
          if (!Utils.isNullOrUndefined(chargingStation)) {
            this.selectedChargingStation = chargingStation;
          } else {
            this.dialogService.createAndShowOkDialog(
              this.translateService.instant('general.error_backend'),
              this.translateService.instant('general.error_backend')
            );
          }
        },
        error: (error) => {
          this.spinnerService.hide();
          this.dialogService.createAndShowOkDialog(
            this.translateService.instant('general.error_backend'),
            error
          );
        },
      });
    }
  }

  public loadTag() {
    if (this.idTag.value) {
      this.spinnerService.show();
      this.centralServerService.getTag(this.idTag.value).subscribe({
        next: (tag: Tag) => {
          this.spinnerService.hide();
          if (!Utils.isNullOrUndefined(tag)) {
            this.tag.setValue(Utils.buildTagName(tag));
            this.user.setValue(Utils.buildUserFullName(tag.user));
          } else {
            this.dialogService.createAndShowOkDialog(
              this.translateService.instant('general.error_backend'),
              this.translateService.instant('general.error_backend')
            );
          }
        },
        error: (error) => {
          this.spinnerService.hide();
          this.dialogService.createAndShowOkDialog(
            this.translateService.instant('general.error_backend'),
            error
          );
        },
      });
    }
  }

  public assignTag() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = 'transparent-dialog-container';
    // Set data
    dialogConfig.data = {
      rowMultipleSelection: false,
      staticFilter: {
        UserID: this.userId.value,
        Issuer: true,
      },
    };
    // Show
    const dialogRef = this.dialog.open(TagsDialogComponent, dialogConfig);
    // Register to the answer
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.selectedTag = result[0].objectRef;
        this.tag.setValue(Utils.buildTagName(result[0].objectRef));
        this.idTag.setValue(Utils.buildTagName(result[0].key));
      }
    });
  }

  public assignChargingStation() {
    //   const dialogConfig = new MatDialogConfig();
    //   dialogConfig.minWidth = '70vm';
    //   dialogConfig.disableClose = false;
    //   dialogConfig.panelClass = 'transparent-dialog-container';
    //   let chargingStationId = this.chargingStationId.value;
    //   if (!chargingStationId) {
    //     this.dialogService.createAndShowOkDialog('','');
    //   }
    //   dialogConfig.data = {
    //     dialogTitle: this.translateService.instant('chargingstations.title'),
    //     chargingStationId
    //   };
  }

  public assignConnector() {}

  public typeChanged() {}

  public statusChanged() {}

  private emptyStringToNull(control: AbstractControl) {
    Utils.convertEmptyStringToNull(control);
  }

  private tagActiveValidator(tagControl: AbstractControl): ValidationErrors | null {
    // Check the object
    if (!this.selectedTag || this.selectedTag.active) {
      return null;
    }
    return { inactive: true };
  }
}
