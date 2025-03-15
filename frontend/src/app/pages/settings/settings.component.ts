import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { UserLoginModel } from '../../models/user.model';
import { LoginService } from '../../services/login.service';
import { passwordMatchValidator, PasswordStrengthValidator, isValidLength, hasUppercaseAndLowercase, hasNumber, hasSpecialCharacter } from '../register/password-validators';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatCard } from '@angular/material/card';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatIcon,
    MatFormField,
    MatLabel,
    MatCard,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDivider
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  userForm: FormGroup;
  passwordForm: FormGroup;
  passwordRequirements = [
    { message: 'Password must contain 8 characters', met: false },
    { message: 'An uppercase and a lowercase letter', met: false },
    { message: 'A number and a special character', met: false },
    { message: 'Passwords must match', met: false }
  ];
  passwordTouched: boolean = false;
  errorMsg: string = '';
  emailErrorMsg: string = '';
  userCreated: string = '';
  profileColor: string = localStorage.getItem('profileColor') || '#d84202';
  userEmail: string = localStorage.getItem('userEmail') || '';
  profileInitial: string = localStorage.getItem('userEmail')?.charAt(0).toUpperCase() || '';

  constructor(private fb: FormBuilder, private userService: UserService, private _loginSvc: LoginService
  ) {
    this.userForm = this.fb.group({
      _id: [''],
      username: [''],
      roles: [''],
      theme: ['']
    });

    this.passwordForm = this.fb.group({
      oldPassword: [''],
      newPassword: ['', [PasswordStrengthValidator]],
      confirmPassword: ['']
    }, { validators: passwordMatchValidator() });
    console.log(this.userService.getUser(this._loginSvc.token));
  }

  ngOnInit(): void {
    this.userService.getUser(this._loginSvc.token).then(user => {
      this.userForm.patchValue(user);
      this.userCreated = user._created?.toString() || '';

      // In case local storage didn't get user email value already, set it here
      if (!this.userEmail && user.username) {
        this.userEmail = user.username;
        localStorage.setItem('userEmail', user.username);
        this.profileInitial = user.username.charAt(0).toUpperCase();
        localStorage.setItem('profileInitial', this.profileInitial);
      }
    });
  }

  updateUser(): void {
    const updatedUser: UserLoginModel = this.userForm.value;
    this.userService.updateUser(this._loginSvc.token, updatedUser).then(() => {
      this.emailErrorMsg = ''; // Clear error message on success
      alert('Username changed successfully');
    }).catch(err => {
      if (err.status === 409) {
        // If user with email already exists, show a message
        this.emailErrorMsg = "This email is already registered. Please try a different one.";
      }
    });
  }

  changePassword(): void {
    const currentPassword: string = this.passwordForm.get('oldPassword')?.value;
    const newPassword: string = this.passwordForm.get('newPassword')?.value;
    const confirmPassword: string = this.passwordForm.get('confirmPassword')?.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all fields');
      return;
    } else if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    } else if (!this.passwordForm.valid) {
      alert('Password does not meet requirements');
      return;
    }
    this.userService.changePassword(currentPassword, newPassword).then(() => {
      alert('Password changed successfully');
    }).catch(err => {
      console.error('Error changing password:', err);
    });
  }

  checkPasswordRequirements() {
    const newPassword = this.passwordForm.get('newPassword')?.value || '';
    const confirmPassword = this.passwordForm.get('confirmPassword')?.value || '';

    this.passwordRequirements[0].met = isValidLength(newPassword);
    this.passwordRequirements[1].met = hasUppercaseAndLowercase(newPassword);
    this.passwordRequirements[2].met = hasNumber(newPassword) && hasSpecialCharacter(newPassword);
    this.passwordRequirements[3].met = newPassword === confirmPassword;

    this.passwordTouched = true;
  }
}
