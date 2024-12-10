import { Component, OnInit } from '@angular/core';
import { GithubIntegrationService } from '../../../../common/services/github-integration.service';
import { AuthService } from '../../../../common/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-github-auth',
  templateUrl: './github-auth.component.html',
  styleUrls: ['./github-auth.component.scss']
})
export class GithubAuthComponent implements OnInit {
  isLoading: boolean = false;

  constructor(
    private readonly githubIntegrationService: GithubIntegrationService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly toastrService: ToastrService,
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }

    // Check if redirected from GitHub with an access token
    this.route.queryParams.subscribe((params) => {
      if (params['token']) {
        this.validateIntegrationToken(params['token']);
        this.removeQueryParams({token: null});
      }
    });
  }

  validateIntegrationToken(token: string): void {
    this.isLoading = true;
    this.authService.validateGithubToken(token).subscribe(response => {
      this.isLoading = false;
      if (response.data) {
        this.authService.saveToken(token);
        this.router.navigate(['/']);
      } else {
        this.authService.removeToken();
      }
    }, error => {
        this.isLoading = false;
        this.toastrService.error(error.error.error ?? 'Invalid token');
    });
  }

  removeQueryParams(params: Object): void {
    // Remove query params
    this.router.navigate([], {
      queryParams: params,
      queryParamsHandling: 'merge'
    });
  }

  

  connectToGitHub(): void {
    this.githubIntegrationService.githubAuth();
  }
}
