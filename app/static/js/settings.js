// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//


form = `

<div>
	<h1>Settings</h1>
	<div>
		Enter comma separated list of users to uprank
		<input type="text" placeholder="e.g. flancian, vera" value="${ranking}" />
	</div>
	<div>
		Do you want to auto pull Agora resources? <input type="checkbox"  checked />
	</div>
	<div>
		Do you want to auto pull external resources? <input type="checkbox"  checked />
	</div>
	<div>
		Do you want to auto pull the Stoa? <input type="checkbox"  />
	</div>
	<div>
		Do you want to render wikilinks with brackets? <input type="checkbox" checked />
	</div>
	<button>Save</button>
</div>

<div>
	<h1>Gitea Integration Settings</h1>
	<div>personal token: <input type="text" id="gitea-token" placeholder="${localStorage[" gitea-token"]}" /></div>
	<div>repo name: <input type="text" id="gitea-repo" placeholder="${localStorage[" gitea-repo"]}" /></div>
	<button onClick=saveGitea()>Save</button>
</div>

`