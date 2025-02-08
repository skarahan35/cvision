import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  Component,
  ElementRef,
  ViewChild,
  HostListener,
  inject,
  DestroyRef,
} from '@angular/core';
import { CvisionService } from './cvision.service';
import { Subject, take } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  providers: [CvisionService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  base64PDF: string = '';
  selectedFile: File | null = null;
  displayText: string = 'AI is waiting for your CV...';
  isResponseComplete: boolean = false;
  currentColor: string = '#ff4b2b';
  formattedResponse: string = '';
  disableSendButton: boolean = true;
  isDragging: boolean = false;

  private destroyRef = inject(DestroyRef);

  constructor(
    private http: HttpClient,
    private cvisionService: CvisionService
  ) {}

  processFile(file: File): void {
    if (file.type !== 'application/pdf' || !file.name.endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }

    this.selectedFile = file;
    this.disableSendButton = false;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result as string;
      this.base64PDF = result.split(',')[1];
    };
    reader.readAsDataURL(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;

    if (event.dataTransfer?.files.length) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  async onSendPdf(): Promise<void> {
    if (!this.selectedFile) return;

    this.disableSendButton = true;
    this.isResponseComplete = false;

    const stages = [
      { text: '🔄 Analyzing the CV...', color: '#ff4b2b' },
      { text: '📊 Processing data...', color: '#009ffd' },
      { text: '📝 Generating insights...', color: '#2a2a72' },
    ];

    const cancelSubject = new Subject<void>();

    this.cvisionService
      .sendPdf(this.base64PDF, cancelSubject)
      .pipe(take(1))
      .subscribe({
        next: (response: string) => {
          this.updateAnimation(
            `✅ Analysis complete for: ${this.selectedFile?.name}`,
            '#4CAF50'
          );
          this.isResponseComplete = true;
          this.formattedResponse = this.formatText(response);
        },
        error: () => {
          this.updateAnimation(
            '❌ Analysis failed. Please try again.',
            '#ff0000'
          );
          this.disableSendButton = false;
        },
      });

    this.destroyRef.onDestroy(() => {
      cancelSubject.next();
      cancelSubject.complete();
    });

    for (const stage of stages) {
      await this.updateAnimation(stage.text, stage.color);
      await this.delay(3000);
    }
  }

  async updateAnimation(text: string, color: string): Promise<void> {
    this.displayText = '';
    this.currentColor = color;
    for (const char of text) {
      this.displayText += char;
      await this.delay(50);
    }
  }

  delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  formatText(text: string): string {
    return text
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\n/g, '<br>');
  }
}
