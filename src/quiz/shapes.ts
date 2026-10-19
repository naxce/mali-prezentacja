import triangle from '@phosphor-icons/core/assets/fill/triangle-fill.svg?raw';
import diamond from '@phosphor-icons/core/assets/fill/diamond-fill.svg?raw';
import circle from '@phosphor-icons/core/assets/fill/circle-fill.svg?raw';
import square from '@phosphor-icons/core/assets/fill/square-fill.svg?raw';

const SHAPES = [triangle, diamond, circle, square];

export function shape(i: number): string {
  return `<i class="ans-shape">${SHAPES[i].replace('<svg ', '<svg aria-hidden="true" focusable="false" ')}</i>`;
}
