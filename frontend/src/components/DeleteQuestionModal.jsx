import React, { Component, PropTypes } from "react";

import ModalContent from "metabase/components/ModalContent.jsx";

import inflection from "inflection";

export default class DeleteQuestionModal extends Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            error: null
        };
    }

    static propTypes = {
        card: PropTypes.object.isRequired,
        deleteCardFn: PropTypes.func.isRequired,
        closeFn: PropTypes.func
    };

    async deleteCard() {
        try {
            await this.props.deleteCardFn(this.props.card);
        } catch (error) {
            this.setState({ error });
        }
    }

    render() {
        var formError;
        if (this.state.error) {
            var errorMessage = "Server error encountered";
            if (this.state.error.data &&
                this.state.error.data.message) {
                errorMessage = this.error.errors.data.message;
            }

            // TODO: timeout display?
            formError = (
                <span className="text-error px2">{errorMessage}</span>
            );
        }

        var dashboardCount = this.props.card.dashboard_count + " " + inflection.inflect("dashboard", this.props.card.dashboard_count);

        return (
            <ModalContent
                title="Apagar Pergunta"
                closeFn={this.props.closeFn}
            >
                <div className="Form-inputs mb4">
                    <p>Você tem certeza disso?</p>
                    { this.props.card.dashboard_count > 0 ?
                        <p>Esta pergunta pode ser apagada do Metabase, e também será removida de {dashboardCount}.</p>
                    : null }
                </div>

                <div className="Form-actions">
                    <button className="Button Button--danger" onClick={() => this.deleteCard()}>Sim</button>
                    <button className="Button Button--primary ml1" onClick={this.props.closeFn}>Não</button>
                    {formError}
                </div>
            </ModalContent>
        );
    }
}
