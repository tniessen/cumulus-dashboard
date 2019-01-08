'use strict';
import React from 'react';
import c from 'classnames';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import { logout, getApiVersion } from '../../actions';
import { graphicsPath, nav } from '../../config';
import { window } from '../../utils/browser';
import { strings } from '../locale';

const paths = [
  ['PDRs', '/pdrs'],
  ['Providers', '/providers'],
  [strings.collections, '/collections'],
  [strings.granules, '/granules'],
  ['Workflows', '/workflows'],
  ['Executions', '/executions'],
  ['Rules', '/rules'],
  ['Logs', '/logs'],
  ['Reconciliation Reports', 'reconciliation-reports']
];

var Header = createReactClass({
  displayName: 'Header',
  propTypes: {
    api: PropTypes.object,
    dispatch: PropTypes.func,
    location: PropTypes.object,
    minimal: PropTypes.bool
  },

  UNSAFE_componentWillMount: function () {
    const { dispatch, api } = this.props;
    if (api.authenticated) dispatch(getApiVersion());
  },

  logout: function () {
    const { dispatch } = this.props;
    dispatch(logout()).then(() => {
      if (window.location && window.location.reload) {
        window.location.reload();
      }
    });
  },

  className: function (path) {
    const active = this.props.location.pathname.slice(0, path.length) === path;
    const menuItem = path.replace('/', '');
    const order = 'nav__order-' + (nav.order.indexOf(menuItem) === -1 ? 2 : nav.order.indexOf(menuItem));
    return c({
      'active': active,
      [order]: true
    });
  },

  render: function () {
    const { authenticated } = this.props.api;
    const activePaths = paths.filter(pathObj => nav.exclude[pathObj[1].replace('/', '')] !== true);

    return (
      <div className='header'>
        <div className='row'>
          <h1 className='logo'><Link to='/'><img alt="Logo" src={graphicsPath + strings.logo} /></Link></h1>
          <nav>
            { !this.props.minimal ? <ul>
              {activePaths.map(path => <li
                key={path[0]}
                className={this.className(path[1])}><Link to={path[1]}>{path[0]}</Link></li>)}
              <li className='rightalign nav__order-8'>{ authenticated ? <a onClick={this.logout}>Log out</a> : <Link to={'/login'}>Log in</Link> }</li>
            </ul> : <li>&nbsp;</li> }
          </nav>
        </div>
      </div>
    );
  }
});

export default Header;
