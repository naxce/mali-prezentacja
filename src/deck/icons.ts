import arrowLeft from '@phosphor-icons/core/assets/regular/arrow-left.svg?raw';
import arrowRight from '@phosphor-icons/core/assets/regular/arrow-right.svg?raw';
import cornersOut from '@phosphor-icons/core/assets/regular/corners-out.svg?raw';
import feather from '@phosphor-icons/core/assets/regular/feather.svg?raw';
import github from '@phosphor-icons/core/assets/regular/github-logo.svg?raw';
import back from '@phosphor-icons/core/assets/regular/arrow-u-up-left.svg?raw';
import qr from '@phosphor-icons/core/assets/regular/qr-code.svg?raw';
import users from '@phosphor-icons/core/assets/regular/users.svg?raw';
import play from '@phosphor-icons/core/assets/regular/play.svg?raw';
import x from '@phosphor-icons/core/assets/regular/x.svg?raw';
import check from '@phosphor-icons/core/assets/regular/check.svg?raw';
import warning from '@phosphor-icons/core/assets/regular/warning.svg?raw';
import clock from '@phosphor-icons/core/assets/regular/clock.svg?raw';
import wifi from '@phosphor-icons/core/assets/regular/wifi-high.svg?raw';

export const ICONS = { arrowLeft, arrowRight, cornersOut, feather, github, back, qr, users, play, x, check, warning, clock, wifi };

export function icon(name: keyof typeof ICONS): string {
  return ICONS[name].replace('<svg ', '<svg aria-hidden="true" focusable="false" ');
}
