import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { MenuComponent } from "./components/menu/menu.component";
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TopnavComponent } from './components/topnav/topnav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenuComponent, CommonModule, TopnavComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Aroma';
  showMenu: boolean = true;
  noMenuPaths = ['/login', '/register', '/'];
  currentRoute: string = '';

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
      this.showMenu = window.innerWidth > 768 && !this.isNoMenuPath(event.url);
    });
  }

  isNoMenuPath(url: string): boolean {
    return this.noMenuPaths.includes(url);
  }
  
  toggleMenu() {
    if (!this.isNoMenuPath(this.router.url)) {
      this.showMenu = !this.showMenu;
    }
  }

  onScroll(event:any){
    const header = document.querySelector('.header');
    const scrollPosition = event.target.scrollTop;
    if (scrollPosition > 0) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  }
  
  // Sets light or dark mode based on system settings when user first opens app, 
  // then saves what the user toggles it to manually afterwards
  ngOnInit() {
    // Check for saved user preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.body.classList.toggle('dark-mode', savedTheme === 'dark');
    } else {
      this.setThemeBasedOnSystemPreference();
    }

    // Listen for system preference changes and update the theme
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      if (!localStorage.getItem('theme')) {
        document.body.classList.toggle('dark-mode', event.matches);
      }
    });

    // Set showMenu based on screen size on component load
    this.showMenu = window.innerWidth > 768 && !this.isNoMenuPath(this.router.url);
  }

  // Apply theme based on system preference
  private setThemeBasedOnSystemPreference() {
    const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark-mode', userPrefersDark);
  }

  // Listen to window resize events to update menu visibility
  @HostListener('window:resize', [])
  onResize() {
    this.showMenu = window.innerWidth > 768 && !this.isNoMenuPath(this.router.url);
  }
}