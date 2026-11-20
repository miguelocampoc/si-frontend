import { ComponentFixture, TestBed } from '@angular/core/testing';
import { User } from '../../../core/models/user.model';
import { UserDeleteModalComponent } from './user-delete-modal.component';

const USER: User = { id: 3, name: 'Linus', email: 'linus@example.com' };

describe('UserDeleteModalComponent', () => {
  let fixture: ComponentFixture<UserDeleteModalComponent>;
  let component: UserDeleteModalComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [UserDeleteModalComponent] });
    fixture = TestBed.createComponent(UserDeleteModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('user', USER);
    fixture.detectChanges();
  });

  it('includes the user name in the confirmation message', () => {
    const message = (fixture.nativeElement as HTMLElement).querySelector('[data-test="delete-message"]');
    expect(message?.textContent).toContain('Linus');
  });

  it('emits confirmed with the user', () => {
    const spy = vi.fn();
    component.confirmed.subscribe(spy);
    component.confirm();
    expect(spy).toHaveBeenCalledWith(USER);
  });

  it('does not emit confirmed while loading or without a user', () => {
    const spy = vi.fn();
    component.confirmed.subscribe(spy);

    fixture.componentRef.setInput('loading', true);
    component.confirm();

    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('user', null);
    component.confirm();

    expect(spy).not.toHaveBeenCalled();
  });

  it('cancel emits visibleChange(false) unless loading', () => {
    const spy = vi.fn();
    component.visibleChange.subscribe(spy);

    fixture.componentRef.setInput('loading', true);
    component.close();
    expect(spy).not.toHaveBeenCalled();

    fixture.componentRef.setInput('loading', false);
    component.close();
    expect(spy).toHaveBeenCalledWith(false);
  });

  it('displays an error message', () => {
    fixture.componentRef.setInput('error', 'Could not delete the user.');
    fixture.detectChanges();
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[data-test="delete-error"]');
    expect(alert?.textContent).toContain('Could not delete');
  });
});
