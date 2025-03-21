import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import StyledEngineProvider from 'components/providers/StyledEngineProvider';
import { ThemeProvider } from '@mui/styles';
import { CssBaseline } from '@mui/material';
import App from './App';
import {store} from './store/store';
import theme from './theme';
import './assets/css/index.css';

import { create } from "jss";
import { jssPreset } from "@mui/styles";

// Configure JSS
const jss = create({
  ...jssPreset(),
  // Define global class names
  generateClassName: (rule) => `${rule.key}-${Math.floor(Math.random() * 10000)}`
});

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <StrictMode><StyledEngineProvider><ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider></StyledEngineProvider></StrictMode>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
