import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CvisionService {
  private readonly API_URL = 'https://cvreview.onrender.com/api/CvReview/extract';

  constructor(private http: HttpClient) {}

  sendPdf(base64Pdf: string, cancellationToken?: Subject<void>): Observable<string> {
    return this.http
      .post<{ choices: { message: { content: string } }[] }>(this.API_URL, { base64Pdf })
      .pipe(
        takeUntil(cancellationToken ?? new Subject<void>()),
        map(response => response.choices[0].message.content)
      );
  }

}
