import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from "../../../../common/services/auth.service";
import {GithubIntegrationService} from "../../../../common/services/github-integration.service";
import {IAccount} from "../../../../common/models/IAccount";
import {ActivatedRoute, Router} from "@angular/router";
import {ToastrService} from "ngx-toastr";

@Component({
  selector: 'app-github-integration',
  templateUrl: './github-integration.component.html',
  styleUrls: ['./github-integration.component.scss']
})
export class GithubIntegrationComponent implements OnInit, OnDestroy {
  isAuthenticated: boolean = false;
  accountDetails: IAccount | null = null;

  constructor(private route: ActivatedRoute,
              private readonly authService: AuthService,
              private readonly githubIntegrationService: GithubIntegrationService,
              private readonly toastrService: ToastrService,) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.isAuthenticated = true;

    }
    // Check if redirected from GitHub with an access token
    this.route.queryParams.subscribe((params) => {
      if (params['token']) {
        this.validateIntegrationToken(params['token']);
      }
    });
  }

  validateIntegrationToken(token: string): void {
    this.authService.validate(token).subscribe(response => {
      if (response.data) {
        this.isAuthenticated = true;
        this.authService.saveToken(token);
        this.accountDetails = this.authService.decodeToken();
      }
    }, error => {
        this.toastrService.error(error.message ?? 'Invalid token');
    });
  }

  ngOnDestroy(): void {

  }

  removeIntegration() {
    this.githubIntegrationService.removeIntegration().subscribe(response => {
      if (response.data.success) {
        this.isAuthenticated = false;
        this.authService.removeToken();
      }
    }, err => {

    });
  }

  connectToGitHub(): void {
    this.githubIntegrationService.githubAuth();
  }
}
