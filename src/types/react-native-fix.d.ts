import * as React from 'react';

declare module 'react' {
  interface FragmentProps {
    key?: React.Key | null | undefined;
  }
}
