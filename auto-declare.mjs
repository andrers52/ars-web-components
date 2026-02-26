import { Project, SyntaxKind, TypeGuards, Node } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

const tsConfigFilePath = path.join(process.cwd(), "tsconfig.json");
const project = new Project({ tsConfigFilePath });

project.getSourceFiles().forEach((sourceFile) => {
    let needsSave = false;
    sourceFile.getClasses().forEach((cls) => {
        const existingProperties = new Set(
            cls.getProperties().map((p) => p.getName())
        );
        const propertiesToAdd = new Map();

        cls.forEachDescendant((node) => {
            // Find all PropertyAccessExpressions where the expression is 'this'
            if (
                Node.isPropertyAccessExpression(node) &&
                node.getExpression().getKind() === SyntaxKind.ThisKeyword
            ) {
                const propName = node.getName();
                // Ignore methods and already defined properties
                if (
                    !existingProperties.has(propName) &&
                    !cls.getMethod(propName) &&
                    !cls.getGetAccessor(propName) &&
                    !cls.getSetAccessor(propName)
                ) {
                    propertiesToAdd.set(propName, "any");
                }
            }
        });

        if (propertiesToAdd.size > 0) {
            propertiesToAdd.forEach((type, name) => {
                cls.addProperty({
                    name,
                    type,
                    hasExclamationToken: true,
                });
                existingProperties.add(name);
            });
            needsSave = true;
        }
    });

    if (needsSave) {
        sourceFile.saveSync();
    }
});
