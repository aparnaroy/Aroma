import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { passwordMatchValidator, PasswordStrengthValidator, isValidLength, hasUppercaseAndLowercase, hasNumber, hasSpecialCharacter } from './password-validators';
import { LoginService } from '../../services/login.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatButtonModule, MatInputModule, MatIconModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})

export class RegisterComponent implements OnInit {
  registerForm: FormGroup = new FormGroup({
    email: new FormControl(null, [Validators.required, Validators.email]),
    password: new FormControl(null, [PasswordStrengthValidator]),
    password2: new FormControl(null, []),
  }, { validators: passwordMatchValidator() });

  public errorMsg: string = "";

  hidePassword: boolean = true;
  hideRepeatPassword: boolean = true;
  passwordTouched: boolean = false;

  passwordRequirements = [
    { message: 'Password must contain 8 characters', met: false },
    { message: 'An uppercase and a lowercase letter', met: false },
    { message: 'A number and a special character', met: false },
    { message: 'Passwords must match', met: false }
  ];

  constructor(
    private router: Router,
    private loginService: LoginService,
  ) { }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  toggleRepeatPasswordVisibility() {
    this.hideRepeatPassword = !this.hideRepeatPassword;
  }

  checkPasswordRequirements() {
    const password = this.registerForm.get('password')?.value || '';
    const password2 = this.registerForm.get('password2')?.value || '';

    this.passwordRequirements[0].met = isValidLength(password);
    this.passwordRequirements[1].met = hasUppercaseAndLowercase(password);
    this.passwordRequirements[2].met = hasNumber(password) && hasSpecialCharacter(password);
    this.passwordRequirements[3].met = password === password2;
  }

  async register() {
    if (!this.registerForm.valid) return;
    this.errorMsg = "";

    const email = this.registerForm.get("email")?.value;
    const password = this.registerForm.get("password")?.value;
    if (email && password) {
      try {
        const result = await this.loginService.register(email, password);
        if (result) {
          this.router.navigate(["/recipes"]);
        }
      } catch (error: any) {
        if (error.status === 409) {
          // If user with email already exists, show a message
          this.errorMsg = "This email is already registered. Please try a different one.";
        } else {
          this.errorMsg = "An error occurred during registration. Please try again later.";
        }
      }
    }
  }

  // Handling if user is already logged in and tries to go to login page
  isLoggedIn: boolean = false;

  ngOnInit(): void {
    this.loginService.loggedIn.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });
  }

  goToLoginPage() {
    if (this.isLoggedIn) {
      // If logged in, navigate to the recipes page
      this.router.navigate(['/recipes']);
    } else {
      // Otherwise, continue with the login process
      this.router.navigate(['/login']);
    }
  }
}