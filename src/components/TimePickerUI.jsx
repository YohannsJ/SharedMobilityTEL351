// import { TimepickerUI } from 'timepicker-ui';
// // import 'timepicker-ui/dist/style.css';
// import React, { useEffect, useRef } from 'react';
// const CustomTimePicker = () => {
//   const ref = useRef();
//   useEffect(() => {
//     const tp = new TimepickerUI(ref.current, { theme: 'm3', mobile: false });
//     tp.create();
//   }, []);
  
//   return <div ref={ref}><input type="text" /></div>;
// }

// export default CustomTimePicker;


// import * as React from 'react';
// import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';

// export default function CustomDateTimePicker() {
//   return (
//     <LocalizationProvider dateAdapter={AdapterDayjs}>
//       <DemoContainer components={['DateTimePicker', 'DateTimePicker']}>
//         <DateTimePicker
//           label="With Time Clock"
//           viewRenderers={{
//             hours: renderTimeViewClock,
//             minutes: renderTimeViewClock,
//             seconds: renderTimeViewClock,
//           }}
//         />
//         <DateTimePicker
//           label="Without view renderers"
//           viewRenderers={{
//             hours: null,
//             minutes: null,
//             seconds: null,
//           }}
//         />
//       </DemoContainer>
//     </LocalizationProvider>
//   );
// }
import * as React from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import dayjs from 'dayjs';

export default function CustomDateTimePicker({ value, onChange, label }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateTimePicker
        label={label}
        value={value}
        onChange={onChange}
        viewRenderers={{
          hours: renderTimeViewClock,
          minutes: renderTimeViewClock,
          seconds: renderTimeViewClock,
        }}
      />
    </LocalizationProvider>
  );
}
