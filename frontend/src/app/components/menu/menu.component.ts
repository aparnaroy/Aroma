import { Component, Input } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule, RouterLink, RouterLinkActive],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  public authenticated: boolean = false;
  @Input() visible: boolean = true;

  constructor(private _loginSvc: LoginService, private router: Router) {
    _loginSvc.loggedIn.subscribe(this.onLoginChange);
    router.events.subscribe({
      next: (event) => {
        if (event instanceof NavigationEnd && (event.url.indexOf("login") >= 0 || event.url.indexOf("register") >= 0)) {
          this.visible = false;
        } else {
          this.visible = true;
        }
      }
    })
  }
  
  onLoginChange = async (loggedIn: boolean) => {
    this.authenticated = loggedIn;
  }

  toggle() {
    this.visible = !this.visible;
  }

  logout() {
    this._loginSvc.logout();
  }

  navigateHome() {
    this.router.navigate(['/']);
  }
}
