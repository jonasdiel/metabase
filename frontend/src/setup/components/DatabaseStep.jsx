import React, { Component, PropTypes } from "react";
import _ from "underscore";

import DatabaseDetailsForm from "metabase/components/database/DatabaseDetailsForm.jsx";
import FormField from "metabase/components/form/FormField.jsx";
import MetabaseAnalytics from "metabase/lib/analytics";

import StepTitle from './StepTitle.jsx'
import CollapsedStep from "./CollapsedStep.jsx";
import { setDatabaseDetails, validateDatabase } from "../actions";


export default class DatabaseStep extends Component {
    constructor(props, context) {
        super(props, context);
        this.state = { 'engine': "", 'formError': null };
    }

    static propTypes = {
        dispatch: PropTypes.func.isRequired,
        engines: PropTypes.object.isRequired,
        stepNumber: PropTypes.number.isRequired
    }

    chooseDatabaseEngine() {
        let engine = React.findDOMNode(this.refs.engine).value;

        this.setState({
            'engine': engine
        });

        MetabaseAnalytics.trackEvent('Setup', 'Choose Database', engine);
    }

    async detailsCaptured(details) {
        this.setState({
            'formError': null
        });

        // make sure that we are trying ssl db connections to start with
        details.details.ssl = true;

        try {
            // validate the details before we move forward
            await this.props.dispatch(validateDatabase(details));

        } catch (error) {
            let formError = error;
            details.details.ssl = false;

            try {
                // ssl connection failed, lets try non-ssl
                await this.props.dispatch(validateDatabase(details));

                formError = null;

            } catch (error2) {
                formError = error2;
            }

            if (formError) {
                MetabaseAnalytics.trackEvent('Setup', 'Error', 'database validation: '+this.state.engine);

                this.setState({
                    'formError': formError
                });

                return;
            }
        }

        // now that they are good, store them
        this.props.dispatch(setDatabaseDetails({
            'nextStep': ++this.props.stepNumber,
            'details': details
        }));

        MetabaseAnalytics.trackEvent('Setup', 'Database Step', this.state.engine);
    }

    skipDatabase() {
        this.setState({
            'engine': ""
        });

        this.props.dispatch(setDatabaseDetails({
            'nextStep': ++this.props.stepNumber,
            'details': null
        }));

        MetabaseAnalytics.trackEvent('Setup', 'Database Step');
    }

    renderEngineSelect() {
        let { engines } = this.props;
        let { engine } = this.state,
        engineNames = _.keys(engines).sort();

        let options = [(<option value="">Select the type of Database you use</option>)];
        engineNames.forEach(function(opt) {
            options.push((<option key={opt} value={opt}>{engines[opt].name}</option>))
        });

        return (
            <label className="Select Form-offset mt1">
                <select ref="engine" defaultValue={engine} onChange={this.chooseDatabaseEngine.bind(this)}>
                    {options}
                </select>
            </label>
        );
    }

    render() {
        let { activeStep, databaseDetails, dispatch, engines, stepNumber } = this.props;
        let { engine, formError } = this.state;

        let stepText = 'Informe seus dados';
        if (activeStep > stepNumber) {
            stepText = (databaseDetails === null) ? "Vou adicionar meus próprios dados mais tarde" : 'Conectado a '+databaseDetails.name;
        }

        if (activeStep !== stepNumber) {
            return (<CollapsedStep dispatch={dispatch} stepNumber={stepNumber} stepText={stepText} isCompleted={activeStep > stepNumber}></CollapsedStep>)
        } else {
            return (
                <section className="SetupStep rounded full relative SetupStep--active">
                    <StepTitle title={stepText} number={stepNumber} />
                    <div className="mb4">
                        <div style={{maxWidth: 600}} className="Form-field Form-offset">
                        Você vai precisar de algumas informações sobre seu banco de dados, como o nome de usuário e senha. Se você não tem isso agora, Metabase também vem com um conjunto de dados de exemplo que você pode começar a usar.
                        </div>

                        <FormField fieldName="engine">
                            {this.renderEngineSelect()}
                        </FormField>

                        { engine !== "" ?
                          <DatabaseDetailsForm
                              details={(databaseDetails && 'details' in databaseDetails) ? databaseDetails.details : null}
                              engine={engine}
                              engines={engines}
                              formError={formError}
                              hiddenFields={{ ssl: true }}
                              submitFn={this.detailsCaptured.bind(this)}
                              submitButtonText={'Next'}>
                          </DatabaseDetailsForm>
                          : null }

                          <div className="Form-field Form-offset">
                              <a className="link" href="#" onClick={this.skipDatabase.bind(this)}>I'll add my data later</a>
                          </div>
                    </div>
                </section>
            );
        }
    }
}
