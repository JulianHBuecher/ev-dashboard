import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ChargingStationsAuthorizations, DialogParamsWithAuth } from 'types/Authorization';
import { Tag } from 'types/Tag';

import { CentralServerService } from '../../../services/central-server.service';
import { ComponentService } from '../../../services/component.service';
import { MessageService } from '../../../services/message.service';
import { SpinnerService } from '../../../services/spinner.service';
import { TagsDialogComponent } from '../../../shared/dialogs/tags/tags-dialog.component';
import { UsersDialogComponent } from '../../../shared/dialogs/users/users-dialog.component';
import { ReserveNow, ReserveNowDialogData } from '../../../types/Reservation';
import { StartTransactionErrorCode } from '../../../types/Transaction';
import { User, UserSessionContext, UserToken } from '../../../types/User';
import { Utils } from '../../../utils/Utils';

@Component({
  templateUrl: 'charging-stations-reserve-now-dialog-component.html'
})
export class ChargingStationsReserveNowDialogComponent implements OnInit {
  public title = '';
  public chargingStationId = '';
  public connectorId = null;
  public selectedUser!: User;
  public selectedTag!: Tag;
  public providedExpiryDate: Date;
  public providedReservationId: number;

  public formGroup!: UntypedFormGroup;
  public user!: AbstractControl;
  public userID!: AbstractControl;
  public tag!: AbstractControl;
  public visualTagId!: AbstractControl;
  public parentTagId!: AbstractControl;
  public expiryDate!: AbstractControl;
  public reservationId!: AbstractControl;

  public errorMessage: string;

  public loggedUser: UserToken;
  public canListUsers = false;

  public constructor(
    private dialog: MatDialog,
    private router: Router,
    public spinnerService: SpinnerService,
    private messageService: MessageService,
    private translateService: TranslateService,
    private componentService: ComponentService,
    private centralServerService: CentralServerService,
    private dialogRef: MatDialogRef<ChargingStationsReserveNowDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: DialogParamsWithAuth<ReserveNowDialogData, ChargingStationsAuthorizations> ) {
    // Set
    this.title = translateService.instant('reservations.dialog.reserve_now_details_title',
      { chargingStationId: data.dialogData.chargingStation.id,
        connectorId: Utils.getConnectorLetterFromConnectorID(data.dialogData.connector.connectorId)
      });
    this.chargingStationId = data.dialogData.chargingStation.id;
    this.connectorId = data.dialogData.connector.connectorId;
    this.loggedUser = this.centralServerService.getLoggedUser();
    this.canListUsers = data.dialogData.chargingStation.canListUsers;
    this.providedExpiryDate = data.dialogData.expiryDate;
    this.providedReservationId = data.dialogData.reservationId;
    Utils.registerValidateCloseKeyEvents(this.dialogRef,
      this.reserveNow.bind(this), this.cancel.bind(this));
  }

  public ngOnInit() {
    // Init the form
    this.formGroup = new UntypedFormGroup({
      // connector: new UntypedFormControl(Utils.getConnectorLetterFromConnectorID(this.connectorId) ?? '',
      //   Validators.compose([
      //     Validators.required
      //   ])),
      user: new UntypedFormControl('',
        Validators.compose([
          Validators.required,
        ])),
      userID: new UntypedFormControl('',
        Validators.compose([
          Validators.required,
        ])),
      tag: new UntypedFormControl('',
        Validators.compose([
          Validators.required,
          this.tagActiveValidator.bind(this),
        ])),
      visualTagID: new UntypedFormControl('',
        Validators.compose([
          Validators.required,
        ])),
      // parentIDTag: new UntypedFormControl('',
      //   Validators.compose([
      //     Validators.required,
      //   ])),
      expiryDate: new UntypedFormControl(this.providedExpiryDate ?? '',
        Validators.compose([
          Validators.required
        ])),
      reservationID: new UntypedFormControl(this.providedReservationId ?? '',
        Validators.compose([
          Validators.required
        ]))
    });
    // Form
    this.user = this.formGroup.controls['user'];
    this.userID = this.formGroup.controls['userID'];
    this.tag = this.formGroup.controls['tag'];
    this.visualTagId = this.formGroup.controls['visualTagID'];
    // this.parentIDTag = this.formGroup.controls['parentIDTag'];
    this.expiryDate = this.formGroup.controls['expiryDate'];
    this.reservationId = this.formGroup.controls['reservationID'];
    this.user.setValue(Utils.buildUserFullName(this.loggedUser));
    this.userID.setValue(this.loggedUser.id);
    this.loadUserSessionContext();
  }

  public loadUserSessionContext() {
    if (this.userID.value) {
      this.spinnerService.show();
      this.centralServerService.getUserSessionContext(this.userID.value, this.chargingStationId, this.connectorId).subscribe({
        next: (userSessionContext: UserSessionContext) => {
          this.spinnerService.hide();
          // Set Tag
          this.selectedTag = userSessionContext.tag;
          this.tag.setValue(userSessionContext.tag ? Utils.buildTagName(userSessionContext.tag) : '');
          this.visualTagId.setValue(userSessionContext.tag?.visualID);
          // Update form
          this.formGroup.updateValueAndValidity();
          if (Utils.isEmptyArray(userSessionContext.errorCodes)) {
            this.formGroup.markAsPristine();
            this.formGroup.markAllAsTouched();
          } else {
            // TODO: Add error codes for not supported user context in reservations
            // Setting errors automatically disable start transaction button
            this.formGroup.setErrors(userSessionContext.errorCodes);
            // Set mat-error message depending on errorCode provided
            if (userSessionContext.errorCodes[0] === StartTransactionErrorCode.BILLING_NO_PAYMENT_METHOD) {
              this.errorMessage = this.translateService.instant('transactions.error_start_no_payment_method');
            } else {
              this.errorMessage = this.translateService.instant('transactions.error_start_general');
            }
          }
        },
        error: (error) => {
          this.spinnerService.hide();
          Utils.handleHttpError(error, this.router, this.messageService,
            this.centralServerService, 'general.error_backend');
        }
      });
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
      this.selectedUser = result[0].objectRef;
      this.user.setValue(Utils.buildUserFullName(result[0].objectRef));
      this.userID.setValue(result[0].key);
      this.tag.setValue('');
      this.visualTagId.setValue('');
      this.loadUserSessionContext();
    });
  }

  public assignTag() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = 'transparent-dialog-container';
    // Set data
    dialogConfig.data = {
      rowMultipleSelection: false,
      staticFilter: {
        UserID: this.userID.value,
        Issuer: true
      },
    };
    // Show
    const dialogRef = this.dialog.open(TagsDialogComponent, dialogConfig);
    // Register to the answer
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.selectedTag = result[0].objectRef;
        this.tag.setValue(Utils.buildTagName(result[0].objectRef));
        this.visualTagId.setValue(result[0].key);
      }
    });
  }

  public reserveNow() {
    if (this.formGroup.valid) {
      const reserveNowRequest: ReserveNow = {
        expiryDate: this.expiryDate.value,
        connectorId: this.connectorId,
        idTag: this.selectedTag.id,
        reservationId: this.reservationId.value,
        parentIdTag: this.parentTagId === undefined ? '' : this.parentTagId.value,
        user: this.selectedUser,
      };
      this.dialogRef.close(reserveNowRequest);
    }
  }

  public cancel() {
    this.dialogRef.close();
  }

  private tagActiveValidator(tagControl: AbstractControl): ValidationErrors | null {
    // Check the object
    if (!this.selectedTag || this.selectedTag.active) {
      return null;
    }
    return { inactive: true };
  }
}
