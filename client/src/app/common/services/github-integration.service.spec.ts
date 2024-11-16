import { TestBed } from '@angular/core/testing';

import { GithubIntegrationService } from './github-integration.service';

describe('GithubIntegrationService', () => {
  let service: GithubIntegrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GithubIntegrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
