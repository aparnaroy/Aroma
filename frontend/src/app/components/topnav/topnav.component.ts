import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { LoginService } from '../../services/login.service';
import { Router } from '@angular/router';


@Component({
 selector: 'app-topnav',
 standalone: true,
 imports: [CommonModule],
 templateUrl: './topnav.component.html',
 styleUrl: './topnav.component.scss'
})
export class TopnavComponent {
  profileMenuVisible = false;
  profileColor: string = localStorage.getItem('profileColor') || '';
  profileInitial: string = this.getInitials(localStorage.getItem('userEmail') || '');
  userEmail: string = localStorage.getItem('userEmail') || '';
  
  constructor(private userService: UserService, private loginService: LoginService, private router: Router) {}

  // Toggle theme manually and save preference
  toggleLightDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }


  ngOnInit(): void {
    if (localStorage.getItem('initialized') === "true") {
      return;
    } else {
      this.loginService.userLoggedIn.subscribe(({ userId, userEmail }) => {
        this.initializeUser(userId, userEmail);
      });
    }
  }

  private initializeUser(userId: string, userEmail: string) {
    try {
      const storedColor = localStorage.getItem('profileColor');
      if (storedColor) {
        this.profileColor = storedColor;
      } else if (userId) {
        this.profileColor = this.generateColorFromUUID(userId || '');
        localStorage.setItem('profileColor', this.profileColor);
      }

      const storedEmail = localStorage.getItem('userEmail');
      if (storedEmail) {
        this.userEmail = storedEmail;
      } else {
        this.userEmail = userEmail;
        localStorage.setItem('userEmail', this.userEmail);
      }

      this.profileInitial = this.getInitials(this.userEmail);
      localStorage.setItem('initialized', "true"); // So that we don't do this again when loading other pages
    } catch (err: any) {
      console.error('Error initializing user data:', err);
    }
  }

  toggleProfileMenu() {
    this.profileMenuVisible = !this.profileMenuVisible;
  }

  generateColorFromUUID(uuid: string): string {
    // Hash the UUID to produce a number
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
      hash = uuid.charCodeAt(i) + ((hash << 5) - hash); // Hash function
    }

    hash += 12000;  // Add a constant to adjust the color produced

    // Convert the hash into a 6-digit hexadecimal color code
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF; // Extract 8 bits at a time
      color += ('00' + value.toString(16)).slice(-2); // Convert to hex and pad if necessary
    }

    return color;
  }

  // Get first letter of user email
  private getInitials(userEmail: string): string {
    return userEmail
      .split(' ')
      .map(part => part[0]?.toUpperCase() || '')
      .join('');
  }

  goToSettings() {
    this.toggleProfileMenu();
    this.router.navigate(['/settings']);
  }

  logout() {
    this.toggleProfileMenu();
    this.loginService.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const clickedElement = event.target as HTMLElement;
    const isInsideMenu = clickedElement.closest('.profile-icon-container');
    const isInsideProfileMenu = clickedElement.closest('.profile-menu');

    if (!isInsideMenu && !isInsideProfileMenu && this.profileMenuVisible) {
      this.profileMenuVisible = false;
    }
  }
}