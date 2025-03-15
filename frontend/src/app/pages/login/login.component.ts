import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatButtonModule, MatInputModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent {
  public disableLogin: boolean = false;
  public errorMsg: string = "";
  loginForm: FormGroup = new FormGroup({
    email: new FormControl(null, [Validators.required, Validators.email]),
    password: new FormControl(null, [Validators.required]),
  });
  hidePassword: boolean = true;

  constructor(
    private _loginSvc: LoginService,
    private router: Router
  ) { }

  async login() {
    if (!this.loginForm.valid) {
      return;
    }
    this.errorMsg = "";
    this.disableLogin = true;
    const email = this.loginForm.get("email")?.value;
    const password = this.loginForm.get("password")?.value;
    if (email && password) {
      try {
        const result = await this._loginSvc.login(email, password);
        if (result) {
          this.router.navigate(["/recipes"]);
        } else {
          this.errorMsg = "Invalid login";
          this.disableLogin = false;
        }
      } catch (error) {
        this.errorMsg = "Invalid credentials. Please try again.";
        this.disableLogin = false;
      }
    }
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }
}