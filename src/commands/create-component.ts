import * as vscode from 'vscode';
import * as path from 'path';
const { validateComponentName } = require('../util/validation');
const { createNewFileFromTemplate, checkForFolderAndCreate } = require('../util/file');

export const extensionRoot = path.resolve(__dirname, '..', '..', 'src');

interface Option {
    label: string;
    target: string;
}

const getFileMap = (containerFeatures: Array<Option>) => {
    const files = {
        'component.js': 'templates/component.js',
        'style.scss': 'templates/stylesheet.scss',
    };

    if (!containerFeatures.length) {
        return files;
    }

    const containerName = containerFeatures.reduce(
        (acc, { target }) => acc += `-${target}`,
        'container'
    );

    return {
        ...files,
        'container.js': `../templates/${containerName}.js`
    };
};

export default async (isRoute: Boolean) => {
    const pathToSourceFolder = isRoute ? 'src/app/route' : 'src/app/component';

    const componentName = await vscode.window.showInputBox({
        placeHolder: isRoute ? 'MyRoute' : 'MyComponent',
        prompt: isRoute ? 'Enter route name' : 'Enter component name',
        validateInput: validateComponentName
    });

    if (!componentName) {
        vscode.window.showErrorMessage(!isRoute
            ? 'Component name is required!'
            : 'Route name is required!'
        );
        return;
    }

    const containerFeatures = await vscode.window.showQuickPick(
        [
            { label: 'Contains business logic', target: 'logic' },
            { label: 'Connected to global state', target: 'state' }
        ],
        {
            placeHolder: 'Select features of your container',
            canPickMany: true
        }
    ) || [];

    checkForFolderAndCreate(pathToSourceFolder);
    checkForFolderAndCreate(`${pathToSourceFolder}/${componentName}`);

    createNewFileFromTemplate(
        path.join(extensionRoot, `templates/${
            containerFeatures.length ? 'index-container.js' : 'index.js'
        }`),
        `${pathToSourceFolder}/${componentName}/index.js`,
        /Placeholder/g,
        componentName
    );

    Object.entries(getFileMap(containerFeatures)).forEach(([postfix, src]) => {
        createNewFileFromTemplate(
            path.join(extensionRoot, src),
            `${pathToSourceFolder}/${componentName}/${componentName}.${postfix}`,
            /Placeholder/g,
            componentName
        );
    });
};