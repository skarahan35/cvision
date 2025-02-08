import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, ElementRef, ViewChild, HostListener } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  base64PDF: string | null = null;
  selectedFile: File | null = null;
  displayText: string = 'AI is waiting for your CV...';
  isResponseComplete: boolean = false;
  currentColor: string = '#ff4b2b';
  formattedResponse: any;
  disableSendButton: boolean = true;
  isDragging: boolean = false;

  constructor(private http: HttpClient) {}

  processFile(file: File): void {
    if (file.type !== 'application/pdf' || !file.name.endsWith('.pdf')) {
      alert('Lütfen sadece PDF dosyası seçiniz.');
      return;
    }

    this.selectedFile = file;
    this.disableSendButton = false;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.base64PDF = (e.target?.result as string).split(',')[1];
      console.log('Base64 Encoded PDF:', this.base64PDF);
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
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  async onSendPdf(): Promise<void> {
    if (this.selectedFile) {
      this.disableSendButton = true;
      const data = { base64Pdf: this.base64PDF };
      this.isResponseComplete = false;

      const stages = [
        { text: '🔄 Analyzing the CV...', color: '#ff4b2b' },
        { text: '📊 Processing data...', color: '#009ffd' },
        { text: '📝 Generating insights...', color: '#2a2a72' },
      ];

      for (let stage of stages) {
        await this.updateAnimation(stage.text, stage.color);
        await this.delay(2000);
      }

      this.http.post('https://cvreview.onrender.com/api/CvReview/extract', data)
        .subscribe((res: any) => {
          this.updateAnimation(`✅ Analysis complete for: ${this.selectedFile?.name}`, '#4CAF50');
          this.isResponseComplete = true;
          this.formattedResponse = this.formatText(res.choices[0].message.content);
        });
    }
  }

  async updateAnimation(text: string, color: string): Promise<void> {
    this.displayText = '';
    this.currentColor = color;
    for (let char of text) {
      this.displayText += char;
      await this.delay(50);
    }
  }

  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  formatText(text: string): string {
    return text
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\n/g, '<br>');
  }
}
