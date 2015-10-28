import React, { Component, PropTypes } from "react";
import _ from "underscore";

import LoadingAndErrorWrapper from "metabase/components/LoadingAndErrorWrapper.jsx";
import MetabaseSettings from "metabase/lib/settings";
import MetabaseUtils from "metabase/lib/utils";
import Modal from "metabase/components/Modal.jsx";
import ModalContent from "metabase/components/ModalContent.jsx";
import PasswordReveal from "metabase/components/PasswordReveal.jsx";
import UserAvatar from "metabase/components/UserAvatar.jsx";

import EditUserForm from "./EditUserForm.jsx";
import UserActionsSelect from "./UserActionsSelect.jsx";
import UserRoleSelect from "./UserRoleSelect.jsx";
import { createUser,
         deleteUser,
         fetchUsers,
         grantAdmin,
         resetPasswordManually,
         resetPasswordViaEmail,
         revokeAdmin,
         showModal,
         updateUser } from "../actions";


export const MODAL_ADD_PERSON = 'MODAL_ADD_PERSON';
export const MODAL_EDIT_DETAILS = 'MODAL_EDIT_DETAILS';
export const MODAL_INVITE_RESENT = 'MODAL_INVITE_RESENT';
export const MODAL_REMOVE_USER = 'MODAL_REMOVE_USER';
export const MODAL_RESET_PASSWORD = 'MODAL_RESET_PASSWORD';
export const MODAL_RESET_PASSWORD_MANUAL = 'MODAL_RESET_PASSWORD_MANUAL';
export const MODAL_RESET_PASSWORD_EMAIL = 'MODAL_RESET_PASSWORD_EMAIL';
export const MODAL_USER_ADDED_WITH_INVITE = 'MODAL_USER_ADDED_WITH_INVITE';
export const MODAL_USER_ADDED_WITH_PASSWORD = 'MODAL_USER_ADDED_WITH_PASSWORD';


export default class AdminPeople extends Component {

    constructor(props, context) {
        super(props, context);

        this.state = { error: null };
    }

    static propTypes = {
        dispatch: PropTypes.func.isRequired,
        users: PropTypes.array
    };

    async componentDidMount() {
        try {
            await this.props.dispatch(fetchUsers());
        } catch (error) {
            this.setState({ error });
        }
    }

    onRoleChange(user, roleDef) {
        if (roleDef.id === "user" && user.is_superuser) {
            // check that this isn't the last admin in the system
            let admins = _.pick(this.props.users, function(value, key, object) {
                return value.is_superuser;
            });

            if (admins && _.keys(admins).length > 1) {
                this.props.dispatch(revokeAdmin(user));
            }

        } else if (roleDef.id === "admin" && !user.is_superuser) {
            this.props.dispatch(grantAdmin(user));
        }
    }

    async onAddPerson(user) {
        // close the modal no matter what
        this.props.dispatch(showModal(null));

        if (user) {
            let modal = MODAL_USER_ADDED_WITH_INVITE;

            // we assume invite style creation and tweak as needed if email not available
            if (!MetabaseSettings.isEmailConfigured()) {
                modal = MODAL_USER_ADDED_WITH_PASSWORD;
                user.password = MetabaseUtils.generatePassword();
            }

            // create the user
            this.props.dispatch(createUser(user));

            // carry on
            this.props.dispatch(showModal({
                type: modal,
                details: {
                    user: user
                }
            }));
        }
    }

    onEditDetails(user) {
        // close the modal no matter what
        this.props.dispatch(showModal(null));

        if (user) {
            this.props.dispatch(updateUser(user));
        }
    }

    onPasswordResetConfirm(user) {
        if (MetabaseSettings.isEmailConfigured()) {
            // trigger password reset email
            this.props.dispatch(resetPasswordViaEmail(user));

            // show confirmation modal
            this.props.dispatch(showModal({
                type: MODAL_RESET_PASSWORD_EMAIL,
                details: {user: user}
            }));

        } else {
            // generate a password
            const password = MetabaseUtils.generatePassword(14, MetabaseSettings.get('password_complexity'));

            // trigger the reset
            this.props.dispatch(resetPasswordManually(user, password));

            // show confirmation modal
            this.props.dispatch(showModal({
                type: MODAL_RESET_PASSWORD_MANUAL,
                details: {password: password, user: user}
            }));
        }
    }

    onRemoveUserConfirm(user) {
        this.props.dispatch(showModal(null));
        this.props.dispatch(deleteUser(user));
    }

    renderAddPersonModal(modalDetails) {
        return (
            <Modal>
                <ModalContent title="Adicionar pessoa"
                              closeFn={() => this.props.dispatch(showModal(null))}>
                    <EditUserForm
                        buttonText="Adicionar pessoa"
                        submitFn={this.onAddPerson.bind(this)} />
                </ModalContent>
            </Modal>
        );
    }

    renderEditDetailsModal(modalDetails) {
        let { user } = modalDetails;

        return (
            <Modal>
                <ModalContent title="Editar detalhes"
                              closeFn={() => this.props.dispatch(showModal(null))}>
                    <EditUserForm
                        user={user}
                        submitFn={this.onEditDetails.bind(this)} />
                </ModalContent>
            </Modal>
        );
    }

    renderUserAddedWithPasswordModal(modalDetails) {
        let { user } = modalDetails;

        return (
            <Modal className="Modal Modal--small">
                <ModalContent title={user.first_name+" has been added"}
                              closeFn={() => this.props.dispatch(showModal(null))}
                              className="Modal-content Modal-content--small NewForm">
                    <div>
                        <div className="px4 pb4">
                            <div className="pb4">Não foi possível enviar o e-mail de convite,
                            por isso certifique-se de avisar para fazer login usando <span className="text-bold">{user.email} </span>
                            e esta senha geramos para ele:</div>

                            <PasswordReveal password={user.password} />

                            <div style={{paddingLeft: "5em", paddingRight: "5em"}} className="pt4 text-centered">Se você deseja habilitar o envio de convites por e-mail, vá para <a className="link text-bold" href="/admin/settings/?section=Email">Configurações de E-mail</a></div>
                        </div>

                        <div className="Form-actions">
                            <button className="Button Button--primary" onClick={() => this.props.dispatch(showModal(null))}>Feito</button>
                            <span className="pl1">or<a className="link ml1 text-bold" href="" onClick={() => this.props.dispatch(showModal({type: MODAL_ADD_PERSON}))}>Adicionar outra pessoa</a></span>
                        </div>
                    </div>
                </ModalContent>
            </Modal>
        );
    }

    renderUserAddedWithInviteModal(modalDetails) {
        let { user } = modalDetails;

        return (
            <Modal className="Modal Modal--small">
                <ModalContent title={user.first_name+" has been added"}
                              closeFn={() => this.props.dispatch(showModal(null))}
                              className="Modal-content Modal-content--small NewForm">
                    <div>
                        <div style={{paddingLeft: "5em", paddingRight: "5em"}} className="pb4">Enviamos um convite para <span className="text-bold">{user.email}</span> com instruções para definir sua senha.</div>

                        <div className="Form-actions">
                            <button className="Button Button--primary" onClick={() => this.props.dispatch(showModal(null))}>Feito</button>
                            <span className="pl1">or<a className="link ml1 text-bold" href="" onClick={() => this.props.dispatch(showModal({type: MODAL_ADD_PERSON}))}>Adicionar outra pessoa</a></span>
                        </div>
                    </div>
                </ModalContent>
            </Modal>
        );
    }

    renderInviteResentModal(modalDetails) {
        let { user } = modalDetails;

        return (
            <Modal className="Modal Modal--small">
                <ModalContent title={"We've Re-sent "+user.first_name+"'s Invite"}
                              closeFn={() => this.props.dispatch(showModal(null))}
                              className="Modal-content Modal-content--small NewForm">
                    <div>
                        <div className="px4 pb4">Qualquer convite anteiror por e-mail poderá não mais funcionar.</div>

                        <div className="Form-actions">
                            <button className="Button Button--primary mr2" onClick={() => this.props.dispatch(showModal(null))}>Certo</button>
                        </div>
                    </div>
                </ModalContent>
            </Modal>
        );
    }

    renderRemoveUserModal(modalDetails) {
        let { user } = modalDetails;

        return (
            <Modal className="Modal Modal--small">
                <ModalContent title={"Remove "+user.common_name}
                              closeFn={() => this.props.dispatch(showModal(null))}
                              className="Modal-content Modal-content--small NewForm">
                    <div>
                        <div className="px4 pb4">
                            Você tem certeza de que quer fazer isso? {user.first_name} não será mais possível realizar o login. Isto não poderá mais ser desfeito.
                        </div>

                        <div className="Form-actions">
                            <button className="Button Button--warning" onClick={() => this.onRemoveUserConfirm(user)}>Sim</button>
                            <button className="Button Button--primary ml2" onClick={() => this.props.dispatch(showModal(null))}>Não</button>
                        </div>
                    </div>
                </ModalContent>
            </Modal>
        );
    }

    renderResetPasswordModal(modalDetails) {
        let { user } = modalDetails;

        return (
            <Modal className="Modal Modal--small">
                <ModalContent title={"Resetar a senha de "+user.first_name}
                              closeFn={() => this.props.dispatch(showModal(null))}
                              className="Modal-content Modal-content--small NewForm">
                    <div>
                        <div className="px4 pb4">
                            Você tem certeza de que quer fazer isso?
                        </div>

                        <div className="Form-actions">
                            <button className="Button Button--warning" onClick={() => this.onPasswordResetConfirm(user)}>Sim</button>
                            <button className="Button Button--primary ml2" onClick={() => this.props.dispatch(showModal(null))}>Não</button>
                        </div>
                    </div>
                </ModalContent>
            </Modal>
        );
    }

    renderPasswordResetManuallyModal(modalDetails) {
        let { user, password } = modalDetails;

        return (
            <Modal className="Modal Modal--small">
                <ModalContent title={"A senha de "+user.first_name+"foi resetada com Sucesso!"}
                              closeFn={() => this.props.dispatch(showModal(null))}
                              className="Modal-content Modal-content--small NewForm">
                    <div>
                        <div className="px4 pb4">
                            <span className="pb3 block">Aqui está uma senha temporária que pode ser utilizada para efetuar o login e, em seguida, altere sua senha.</span>

                            <PasswordReveal password={password} />
                        </div>

                        <div className="Form-actions">
                            <button className="Button Button--primary mr2" onClick={() => this.props.dispatch(showModal(null))}>Feito</button>
                        </div>
                    </div>
                </ModalContent>
            </Modal>
        );
    }

    renderPasswordResetViaEmailModal(modalDetails) {
        let { user } = modalDetails;

        return (
            <Modal className="Modal Modal--small">
                <ModalContent title={"A senha de "+user.first_name+" foi resetada!"}
                              closeFn={() => this.props.dispatch(showModal(null))}
                              className="Modal-content Modal-content--small NewForm">
                    <div>
                        <div className="px4 pb4">Enviamos um e-mail com instruções para criar uma nova senha.</div>

                        <div className="Form-actions">
                            <button className="Button Button--primary mr2" onClick={() => this.props.dispatch(showModal(null))}>Feito</button>
                        </div>
                    </div>
                </ModalContent>
            </Modal>
        );
    }

    renderModal(modalType, modalDetails) {

        switch(modalType) {
            case MODAL_ADD_PERSON:               return this.renderAddPersonModal(modalDetails);
            case MODAL_EDIT_DETAILS:             return this.renderEditDetailsModal(modalDetails);
            case MODAL_USER_ADDED_WITH_PASSWORD: return this.renderUserAddedWithPasswordModal(modalDetails);
            case MODAL_USER_ADDED_WITH_INVITE:   return this.renderUserAddedWithInviteModal(modalDetails);
            case MODAL_INVITE_RESENT:            return this.renderInviteResentModal(modalDetails);
            case MODAL_REMOVE_USER:              return this.renderRemoveUserModal(modalDetails);
            case MODAL_RESET_PASSWORD:           return this.renderResetPasswordModal(modalDetails);
            case MODAL_RESET_PASSWORD_MANUAL:    return this.renderPasswordResetManuallyModal(modalDetails);
            case MODAL_RESET_PASSWORD_EMAIL:     return this.renderPasswordResetViaEmailModal(modalDetails);
        }

        return null;
    }

    render() {
        let { modal, users } = this.props;
        let { error } = this.state;

        users = _.values(users).sort((a, b) => (b.date_joined - a.date_joined));

        return (
            <LoadingAndErrorWrapper loading={!users} error={error}>
            {() =>
                <div className="wrapper">
                    { modal ? this.renderModal(modal.type, modal.details) : null }

                    <section className="PageHeader clearfix px2">
                        <a className="Button Button--primary float-right" href="#" onClick={() => this.props.dispatch(showModal({type: MODAL_ADD_PERSON}))}>Adicionar pessoa</a>
                        <h2 className="PageTitle">Pessoas</h2>
                    </section>

                    <section className="pb4">
                        <table className="ContentTable">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>E-mail</th>
                                    <th>Função</th>
                                    <th>Visto pela última vez</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                { users.map(user =>
                                <tr>
                                    <td><span className="text-white inline-block"><UserAvatar background={(user.is_superuser) ? "bg-purple" : "bg-brand"} user={user} /></span> <span className="ml2 text-bold">{user.common_name}</span></td>
                                    <td>{user.email}</td>
                                    <td>
                                        <UserRoleSelect
                                            user={user}
                                            onChangeFn={this.onRoleChange.bind(this)} />
                                    </td>
                                    <td>{ user.last_login ? user.last_login.fromNow() : "Nunca" }</td>
                                    <td className="text-right">
                                        <UserActionsSelect user={user} dispatch={this.props.dispatch} />
                                    </td>
                                </tr>
                                )}
                            </tbody>
                        </table>
                    </section>
                </div>
            }
            </LoadingAndErrorWrapper>
        );
    }
}
