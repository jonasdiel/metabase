import _ from "underscore";

import SettingsEditor from './components/SettingsEditor.jsx';

import Humanize from "humanize";

var SettingsAdminControllers = angular.module('metabaseadmin.settings.controllers', ['metabase.services']);

// from common.clj
var TIMEZONES = [
    { name: "Padrão do banco de dados", value: "" },
    "GMT",
    "UTC",
    "US/Alaska",
    "US/Arizona",
    "US/Central",
    "US/Eastern",
    "US/Hawaii",
    "US/Mountain",
    "US/Pacific",
    "America/Costa_Rica",
];

// temporary hardcoded metadata
var EXTRA_SETTINGS_METADATA = {
    "site-name":            { display_name: "Nome do Site",          section: "Geral", index: 0, type: "string" },
    "-site-url":            { display_name: "Endereço do site",           section: "Geral", index: 1, type: "string" },
    "report-timezone":      { display_name: "Fuso horário de relatórios",    section: "Geral", index: 2, type: "select", options: TIMEZONES, placeholder: "Selecione um fuso horário" },
    "anon-tracking-enabled":{ display_name: "Rastreamento anônio", section: "Geral", index: 3, type: "boolean" },
    "email-smtp-host":      { display_name: "Endereço SMTP",          section: "E-mail",   index: 0, type: "string" },
    "email-smtp-port":      { display_name: "Porta SMTP",          section: "E-mail",   index: 1, type: "string" },
    "email-smtp-security":  { display_name: "Segurança SMTP",      section: "E-mail",   index: 2, type: "radio", options: { none: "Nenhuma", tls: "TLS", ssl: "SSL" } },
    "email-smtp-username":  { display_name: "Usuário SMTP",      section: "E-mail",   index: 3, type: "string" },
    "email-smtp-password":  { display_name: "Senha SMTP",      section: "E-mail",   index: 4, type: "password" },
    "email-from-address":   { display_name: "E-mail do remetente",       section: "E-mail",   index: 5, type: "string" },
};

SettingsAdminControllers.controller('SettingsEditor', ['$scope', '$location', 'Settings', 'AppState', 'settings',
    function($scope, $location, Settings, AppState, settings) {
        $scope.SettingsEditor = SettingsEditor;

        if ('section' in $location.search()) {
            $scope.initialSection = $location.search().section;
        }

        $scope.updateSetting = async function(setting) {
            await Settings.put({ key: setting.key }, setting).$promise;
            AppState.refreshSiteSettings();
        }

        $scope.sections = {};
        settings.forEach(function(setting) {
            var defaults = { display_name: keyToDisplayName(setting.key), placeholder: setting.default };
            setting = _.extend(defaults, EXTRA_SETTINGS_METADATA[setting.key], setting);
            var sectionName = setting.section || "Other";
            $scope.sections[sectionName] = $scope.sections[sectionName] || [];
            $scope.sections[sectionName].push(setting);
        });
        _.each($scope.sections, (section) => section.sort((a, b) => a.index - b.index))

        function keyToDisplayName(key) {
            return Humanize.capitalizeAll(key.replace(/-/g, " ")).trim();
        }
    }
]);
