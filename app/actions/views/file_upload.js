// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import FormData from 'form-data';
import {Platform} from 'react-native';
import {uploadFile} from 'mattermost-redux/actions/files';
import {lookupMimeType, parseClientIdsFromFormData} from 'mattermost-redux/utils/file_utils';

import {generateId} from 'app/utils/file';
import {ViewTypes} from 'app/constants';

export function handleUploadFiles(files, rootId) {
    return async (dispatch, getState) => {
        const state = getState();

        const channelId = state.entities.channels.currentChannelId;
        const formData = new FormData();
        const clientIds = [];
        const re = /heic/i;

        files.forEach((file) => {
            let name = file.fileName;
            let mimeType = lookupMimeType(name);
            let extension = name.split('.').pop().replace('.', '');
            const uri = file.uri;
            const clientId = generateId();

            if (re.test(extension)) {
                extension = 'JPG';
                name = name.replace(re, 'jpg');
                mimeType = 'image/jpeg';
            }

            clientIds.push({
                clientId,
                localPath: uri,
                name,
                type: mimeType,
                extension
            });

            const fileData = {
                uri,
                name,
                type: mimeType,
                extension
            };

            formData.append('files', fileData);
            formData.append('channel_id', channelId);
            formData.append('client_ids', clientId);
        });

        let formBoundary;
        if (Platform.os === 'ios') {
            formBoundary = '--mobile.client.file.upload';
        }

        dispatch({
            type: ViewTypes.SET_TEMP_UPLOAD_FILES_FOR_POST_DRAFT,
            clientIds,
            channelId,
            rootId
        });

        await uploadFile(channelId, rootId, parseClientIdsFromFormData(formData), formData, formBoundary)(dispatch, getState);
    };
}

export function retryFileUpload(file, rootId) {
    return async (dispatch, getState) => {
        const state = getState();

        const channelId = state.entities.channels.currentChannelId;
        const formData = new FormData();

        const fileData = {
            uri: file.localPath,
            name: file.name,
            type: file.type
        };

        formData.append('files', fileData);
        formData.append('channel_id', channelId);
        formData.append('client_ids', file.clientId);

        let formBoundary;
        if (Platform.os === 'ios') {
            formBoundary = '--mobile.client.file.upload';
        }

        dispatch({
            type: ViewTypes.RETRY_UPLOAD_FILE_FOR_POST,
            clientId: file.clientId,
            channelId,
            rootId
        });

        await uploadFile(channelId, rootId, [file.clientId], formData, formBoundary)(dispatch, getState);
    };
}

export function handleClearFiles(channelId, rootId) {
    return {
        type: ViewTypes.CLEAR_FILES_FOR_POST_DRAFT,
        channelId,
        rootId
    };
}

export function handleClearFailedFiles(channelId, rootId) {
    return {
        type: ViewTypes.CLEAR_FAILED_FILES_FOR_POST_DRAFT,
        channelId,
        rootId
    };
}

export function handleRemoveFile(clientId, channelId, rootId) {
    return {
        type: ViewTypes.REMOVE_FILE_FROM_POST_DRAFT,
        clientId,
        channelId,
        rootId
    };
}

export function handleRemoveLastFile(channelId, rootId) {
    return {
        type: ViewTypes.REMOVE_LAST_FILE_FROM_POST_DRAFT,
        channelId,
        rootId
    };
}
