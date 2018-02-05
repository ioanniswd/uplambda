## Modules

<dl>
<dt><a href="#module_createAlias">createAlias</a></dt>
<dd><p>Create Lambda Alias</p>
</dd>
<dt><a href="#module_getApiInfo">getApiInfo</a></dt>
<dd><p>Get api info for branch</p>
</dd>
<dt><a href="#module_getBranches">getBranches</a></dt>
<dd><p>Return info for branches</p>
</dd>
<dt><a href="#module_getFunctionName">getFunctionName</a></dt>
<dd><p>Get Lambda name</p>
</dd>
<dt><a href="#module_Uplambda">Uplambda</a></dt>
<dd><p>Uploads lambda to AWS and updates API GW stage variables and permission</p>
</dd>
<dt><a href="#module_updateAPIGWPolicy">updateAPIGWPolicy</a></dt>
<dd><p>Gives permissions to API GW to invoke Lambda function</p>
</dd>
<dt><a href="#module_updateAlias">updateAlias</a></dt>
<dd><p>Update lambda alias</p>
</dd>
<dt><a href="#module_uploadS3">uploadS3</a></dt>
<dd><p>Uploads zip to S3 bucket.</p>
</dd>
</dl>

<a name="module_createAlias"></a>

## createAlias
Create Lambda Alias

<a name="exp_module_createAlias--module.exports"></a>

### module.exports(functionName, name, version, apiInfo) ⇒ <code>Promise</code> ⏏
Create a new alias for the last version published for lambda and assigns
permissions to the appropriate API GW resource for that alias

**Kind**: Exported function  
**Returns**: <code>Promise</code> - Update Api GW Policy response  

| Param | Type | Description |
| --- | --- | --- |
| functionName | <code>string</code> | name of lambda function and current branch |
| name | <code>string</code> | the name/alias to be given to the new lambda version |
| version | <code>string</code> | the most recent version which was just published |
| apiInfo | <code>object</code> | Api info found in package json. Used with updateAPIGWPolicy |

<a name="module_getApiInfo"></a>

## getApiInfo
Get api info for branch

<a name="exp_module_getApiInfo--module.exports"></a>

### module.exports() ⇒ <code>Promise</code> ⏏
Get Api Id and Stage Name(s)

**Kind**: Exported function  
**Returns**: <code>Promise</code> - apiId and stageNames  
<a name="module_getBranches"></a>

## getBranches
Return info for branches

<a name="exp_module_getBranches--module.exports"></a>

### module.exports() ⇒ <code>Promise</code> ⏏
Returns the current branch, which is used as the name/alias and the rest
of the branches just in case.

**Kind**: Exported function  
**Returns**: <code>Promise</code> - currentBranch and otherBranches  
<a name="module_getFunctionName"></a>

## getFunctionName
Get Lambda name

<a name="exp_module_getFunctionName--module.exports"></a>

### module.exports() ⇒ <code>string</code> ⏏
Get Lambda name using package.json name attribute.

**Kind**: Exported function  
**Returns**: <code>string</code> - Lambda function name  
<a name="module_Uplambda"></a>

## Uplambda
Uploads lambda to AWS and updates API GW stage variables and permission

<a name="module_updateAPIGWPolicy"></a>

## updateAPIGWPolicy
Gives permissions to API GW to invoke Lambda function

<a name="exp_module_updateAPIGWPolicy--module.exports"></a>

### module.exports(functionName, name, callback, apiInfo) ⇒ <code>Promise</code> ⏏
Gives permissions to resource named functionName.toLowerCase, to invoke Lambda
function alias.

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| functionName | <code>string</code> | Lambda function name |
| name | <code>string</code> | Branch name/lambda alias |
| callback | <code>function</code> |  |
| apiInfo | <code>object</code> | Api info found in package json |

<a name="module_updateAlias"></a>

## updateAlias
Update lambda alias

<a name="exp_module_updateAlias--module.exports"></a>

### module.exports(functionName, name, version, apiInfo) ⇒ <code>Promise</code> ⏏
Updates alias for lambda with name the name of the package, for version
given

**Kind**: Exported function  
**Returns**: <code>Promise</code> - Lambda update response  

| Param | Type | Description |
| --- | --- | --- |
| functionName | <code>string</code> | Lambda function name |
| name | <code>string</code> | The name/alias given to the latest version |
| version | <code>string</code> | The latest version of Lambda function published |
| apiInfo | <code>object</code> | Api info found in package json. Used with create alias |

<a name="module_uploadS3"></a>

## uploadS3
Uploads zip to S3 bucket.

<a name="exp_module_uploadS3--module.exports"></a>

### module.exports(name) ⇒ <code>Promise</code> ⏏
Uploads zip file to S3 bucket uplambda
which trigger a lambda function that
updates the code of the function with
the given name. Currently only works for
latest.

**Kind**: Exported function  
**Returns**: <code>Promise</code> - S3 upload response message  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the lambda function and zip file |

