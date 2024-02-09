import { TestBed } from '@angular/core/testing';

import { ApiService } from './api.service';
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";

describe('ApiService', () => {
  let service: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],  // Add your service to the providers array
    });
    service = TestBed.inject(ApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify(); // Ensure that there are no outstanding requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });


  let httpTestingController: HttpTestingController;


  it('should fetch data from the server', () => {
    const testData = { /* your test data here */ };
    const url = 'https://api.github.com/users/chanduollala';

    // Make the HTTP request
    service.fetchData(url).then(data => {
      expect(data).toEqual(testData);  // Check if the returned data is as expected
    });

    // Expect a single request to the specified URL
    const req = httpTestingController.expectOne(url);

    // Respond with mock data
    req.flush(testData);

    // Ensure that there are no outstanding requests
    httpTestingController.verify();
  });

});
