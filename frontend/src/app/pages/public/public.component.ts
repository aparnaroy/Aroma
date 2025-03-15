import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-public',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './public.component.html',
  styleUrls: ['./public.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PublicComponent implements OnInit {
  isLoggedIn: boolean = false;

  constructor(private loginService: LoginService, private router: Router) {}

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

  // Toggle theme manually and save preference
  toggleLightDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }
}
