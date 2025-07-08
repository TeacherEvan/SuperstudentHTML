// ModalSystem: reusable modal overlay framework
export class ModalSystem {
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
    if (!this.modal) {
      throw new Error(`Modal element with id '${modalId}' not found`);
    }
    this.background = this.modal.querySelector('.modal-background');
    this.content = this.modal.querySelector('.modal-content');
  }

  show(html) {
    this.content.innerHTML = html;
    this.modal.style.display = 'flex';
  }

  hide() {
    this.modal.style.display = 'none';
  }

  on(event, selector, handler) {
    this.content.addEventListener(event, (e) => {
      if (e.target.matches(selector)) {
        handler(e);
      }
    });
  }
}
