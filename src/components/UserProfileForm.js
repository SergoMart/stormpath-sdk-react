import React from 'react';
import { Link } from 'react-router';

import utils from '../utils';
import context from './../context';
import UserActions from '../actions/UserActions';

class DefaultUserProfileForm extends React.Component {
  state = {
    showPasswordVerification: false
  };

  onPasswordChanged(e) {
    this.setState({
      showPasswordVerification: e.target.value.length > 0
    });
  }

  render() {
    return (
      <UserProfileForm {...this.props}>
        <div className='sp-update-profile-form'>
          <div className="row">
            <div className="col-xs-12">
              <div className="form-horizontal">
                <div className="form-group">
                  <label htmlFor="givenName" className="col-xs-12 col-sm-4 control-label">First name</label>
                  <div className="col-xs-12 col-sm-4">
                    <input type="text" className="form-control" id="givenName" name="givenName" placeholder="First name" required />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="surname" className="col-xs-12 col-sm-4 control-label">Last name</label>
                  <div className="col-xs-12 col-sm-4">
                    <input type="text" className="form-control" id="surname" name="surname" placeholder="Last name" required />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="email" className="col-xs-12 col-sm-4 control-label">Email</label>
                  <div className="col-xs-12 col-sm-4">
                    <input type="email" className="form-control" id="email" name="email" placeholder="Email" required />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="password" className="col-xs-12 col-sm-4 control-label">Password</label>
                  <div className="col-xs-12 col-sm-4">
                    <input type="password" className="form-control" id="password" name="password" placeholder="Password" onChange={ this.onPasswordChanged.bind(this) } />
                  </div>
                </div>
                <div >
                  { this.state.showPasswordVerification ?
                      <div className="form-group">
                        <label htmlFor="password" className="col-xs-12 col-sm-4 control-label">Existing password</label>
                        <div className="col-xs-12 col-sm-4">
                          <input type="password" className="form-control" id="existingPassword" name="existingPassword" placeholder="Existing password" required />
                        </div>
                      </div>
                    :
                      null
                  }
                </div>
                <div key="update-button" className="form-group">
                  <div className="col-sm-offset-4 col-sm-4">
                    <p className="alert alert-danger" data-spIf="form.error"><span data-spBind="form.errorMessage" /></p>
                    <p className="alert alert-success" data-spIf="form.successful">Profile updated.</p>
                    <button type="submit" className="btn btn-primary">
                      <span data-spIf="!form.processing">Update</span>
                      <span data-spIf="form.processing">Updating...</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UserProfileForm>
    );
  }
}

export default class UserProfileForm extends React.Component {
  static contextTypes = {
    user: React.PropTypes.object
  };

  state = {
    fields: {},
    defaultFields: this.context.user,
    errorMessage: null,
    isFormProcessing: false,
    isFormSuccessful: false
  };

  _updateSessionData = (data, callback) => {
    var sessionStore = context.sessionStore;

    if (!sessionStore.empty()) {
      var hasChanged = false;
      var updatedSession = utils.clone(sessionStore.get());

      for (var key in data) {
        if (key in updatedSession) {
          if (updatedSession[key] != data[key]) {
            hasChanged = true;
            updatedSession[key] = data[key];
          }
        }
      }

      if (hasChanged) {
        context.userStore.resolveSession(callback, true);
      } else {
        callback();
      }
    }
  };

  _setErrorState(err) {
    this.setState({
      isFormProcessing: false,
      isFormSuccessful: false,
      errorMessage: err.message
    });
  }

  _onFormSubmit(e) {
    e.preventDefault();
    e.persist();

    const {onSubmitError, onSubmitSuccess} = this.props;

    var next = (err, data) => {
      if (err) {
        if (onSubmitError) {
          return onSubmitError({
            data: data,
            error: err
          }, (userError) => this._setErrorState(userError || err));
        }
        return this._setErrorState(err);
      }

      // If the user didn't specify any data,
      // then simply default to what we have in state.
      data = data || this.state.fields;

      UserActions.updateProfile(data, (err) => {
        if (err) {
          if (onSubmitError) {
            return onSubmitError({
              data: data,
              error: err
            }, (userError) => this._setErrorState(userError || err));
          }

          return this._setErrorState(err);
        }

        this._updateSessionData(data, () => {
          const done = this.setState.bind(this, {
            isFormProcessing: false,
            isFormSuccessful: true,
            errorMessage: null
          });

          if (onSubmitSuccess) {
            return onSubmitSuccess({
              data: data
            }, done);
          }
        });
      });
    };

    this.setState({
      isFormProcessing: true
    });

    if (this.props.onSubmit) {
      e.data = this.state.fields;
      this.props.onSubmit(e, next);
    } else {
      next(null, this.state.fields);
    }
  }

  _mapFormFieldHandler(element, tryMapField) {
    var defaultValue = element.props.name ?
      utils.getFieldValue(this.state.defaultFields, element.props.name) :
      undefined;

    if (typeof element.type === 'function' && utils.containsWord(element.type.name, ['input', 'field', 'text'])) {
      if (element.props && element.props.name) {
        tryMapField(element.props.name, defaultValue);
      }
    } else if (element.type === 'input') {
      if (element.props.type === 'submit') {
        return;
      }

      tryMapField(element.props.name, defaultValue);
    }
  }

  _spIfHandler(action, element) {
    var test = null;

    switch (action) {
      case 'form.successful':
        test = this.state.isFormSuccessful;
        break;
      case 'form.processing':
        test = this.state.isFormProcessing;
        break;
      case 'form.error':
        test = !!this.state.errorMessage;
        break;
    }

    return test;
  }

  _spBindHandler(bind, element) {
    var result = false;

    switch (bind) {
      case 'form.errorMessage':
        var className = element.props ? element.props.className : undefined;
        result = <span className={className}>{this.state.errorMessage}</span>;
        break;
    }

    return result;
  }

  render() {
    if (this.props.children) {
      let selectedProps = utils.excludeProps(['onSubmit', 'children'], this.props);

      return (
        <form onSubmit={this._onFormSubmit.bind(this)} {...selectedProps}>
          {utils.makeForm(this, this._mapFormFieldHandler.bind(this), this._spIfHandler.bind(this), this._spBindHandler.bind(this))}
        </form>
      );
    } else {
      return <DefaultUserProfileForm {...this.props} />;
    }
  }
}
