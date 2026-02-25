import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { userEvent } from '@testing-library/user-event';
import { screen } from '@testing-library/react';

/**
 * Interactions Showcase
 * Demonstrates interactive components with Storybook's play function.
 * Stories record and replay user interactions automatically.
 */

const InteractiveForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setSubmitted(false);
  };

  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'var(--font-sans, system-ui)',
        maxWidth: '500px',
        margin: '0 auto',
      }}
    >
      <h1>Interactive Form</h1>
      <p>Fill in the form and submit. Storybook will record your interactions.</p>

      {submitted && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--chart-2)',
            color: 'white',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          ✓ Form submitted! Name: <strong>{name}</strong>, Email: <strong>{email}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'var(--input)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: '0.25rem',
              boxSizing: 'border-box',
              fontSize: '0.875rem',
            }}
            data-testid="name-input"
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'var(--input)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: '0.25rem',
              boxSizing: 'border-box',
              fontSize: '0.875rem',
            }}
            data-testid="email-input"
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
            data-testid="submit-btn"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
            data-testid="reset-btn"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

const InteractiveCounter = () => {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-sans, system-ui)' }}>
      <h1>Interactive Counter</h1>
      <div
        style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          color: 'var(--primary)',
          margin: '2rem 0',
        }}
        data-testid="counter-display"
      >
        {count}
      </div>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          onClick={() => setCount(count - 1)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--destructive)',
            color: 'var(--destructive-foreground)',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
          }}
          data-testid="decrement-btn"
        >
          −
        </button>
        <button
          onClick={() => setCount(0)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--muted)',
            color: 'var(--muted-foreground)',
            border: '1px solid var(--border)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
          data-testid="reset-btn"
        >
          Reset
        </button>
        <button
          onClick={() => setCount(count + 1)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
          }}
          data-testid="increment-btn"
        >
          +
        </button>
      </div>
    </div>
  );
};

const meta = {
  title: 'Design System/Interactions',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

// Form Stories
export const FormDefault: StoryObj = {
  render: () => <InteractiveForm />,
};

export const FormFilled: StoryObj = {
  render: () => <InteractiveForm />,
  play: async () => {
    const nameInput = screen.getByTestId('name-input');
    const emailInput = screen.getByTestId('email-input');
    const submitBtn = screen.getByTestId('submit-btn');

    // Type in form fields
    await userEvent().type(nameInput, 'John Doe', { delay: 50 });
    await userEvent().type(emailInput, 'john@example.com', { delay: 50 });

    // Submit form
    await userEvent().click(submitBtn);
  },
};

// Counter Stories
export const CounterDefault: StoryObj = {
  render: () => <InteractiveCounter />,
};

export const CounterIncremented: StoryObj = {
  render: () => <InteractiveCounter />,
  play: async () => {
    const incrementBtn = screen.getByTestId('increment-btn');

    // Click increment button 5 times
    for (let i = 0; i < 5; i++) {
      await userEvent().click(incrementBtn);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  },
};

export const CounterDecremented: StoryObj = {
  render: () => <InteractiveCounter />,
  play: async () => {
    const incrementBtn = screen.getByTestId('increment-btn');
    const decrementBtn = screen.getByTestId('decrement-btn');

    // Increment to 5
    for (let i = 0; i < 5; i++) {
      await userEvent().click(incrementBtn);
    }

    // Then decrement to 2
    for (let i = 0; i < 3; i++) {
      await userEvent().click(decrementBtn);
    }
  },
};
