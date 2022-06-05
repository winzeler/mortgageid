/**
 * @jest-environment jsdom
 */

import { mount } from '@vue/test-utils';
import TextInput from '../TextInput';

// =================================================================================================

describe('TextInput', () => {
  it('should have correct ID on input', () => {
    const wrapper = mount(TextInput, {
      props: {
        inputId: 'sentry',
        label: 'label',
      },
    });

    expect(wrapper.find('input').wrapperElement.id).toBe('sentry');
  });

  // -----------------------------------------------------------------------------------------------

  it('should have the correct type of input', () => {
    const wrapper = mount(TextInput, {
      props: {
        inputId: 'inputId',
        label: 'label',
        type: 'password',
      },
    });

    expect(wrapper.find('input').wrapperElement.type).toBe('password');
  });

  // -----------------------------------------------------------------------------------------------

  it('should be autofocused', () => {
    const wrapper = mount(TextInput, {
      props: {
        inputId: 'inputId',
        label: 'label',
        autofocus: true,
      },
    });

    expect(wrapper.find('input').wrapperElement.autofocus).toBe(true);
  });

  // -----------------------------------------------------------------------------------------------

  it('should be pre-populated with the correct value', () => {
    const wrapper = mount(TextInput, {
      props: {
        inputId: 'inputId',
        label: 'label',
        modelValue: 'sentry',
      },
    });

    expect(wrapper.find('input').wrapperElement.value).toBe('sentry');
  });

  // -----------------------------------------------------------------------------------------------

  it('should have the correct label text', () => {
    const wrapper = mount(TextInput, {
      props: {
        inputId: 'inputId',
        label: 'abc123',
      },
    });

    expect(wrapper.find('label').text()).toBe('abc123');
  });

  // -----------------------------------------------------------------------------------------------

  it('should update v-model when input value changes', () => {
    const wrapper = mount(TextInput, {
      props: {
        inputId: 'inputId',
        label: 'label',
      },
    });

    wrapper.find('input').setValue('sentry');

    expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['sentry']);
  });
});
